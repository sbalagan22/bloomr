"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const FLOWER_TYPES = [
  { name: "rose", color: "#E8637A", label: "Rose" },
  { name: "tulip", color: "#F4A44E", label: "Tulip" },
  { name: "sunflower", color: "#F5D03B", label: "Sunflower" },
  { name: "daisy", color: "#A8D8EA", label: "Daisy" },
  { name: "lavender", color: "#B09FD8", label: "Lavender" },
] as const;

type FlowerType = (typeof FLOWER_TYPES)[number]["name"];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [topicName, setTopicName] = useState("");
  const [flowerType, setFlowerType] = useState<FlowerType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isSubmitting) {
      setCurrentStep(0);
      return;
    }
    const timers = [
      setTimeout(() => setCurrentStep(1), 3500),
      setTimeout(() => setCurrentStep(2), 8000),
      setTimeout(() => setCurrentStep(3), 14000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isSubmitting]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Only PDF files are supported right now.");
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile && selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else if (selectedFile) {
        setError("Only PDF files are supported right now.");
      }
    },
    []
  );

  const handleSubmit = async () => {
    if (!file || !topicName.trim() || !flowerType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // 1. Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("You must be logged in to upload.");
      }

      // 2. Upload PDF to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 3. Get public URL for the uploaded file
      const fileUrl = fileName; // We'll pass the path, not a public URL

      // 4. POST to Gemini processing API
      const response = await fetch("/api/gemini/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl,
          topicName: topicName.trim(),
          flowerType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Processing failed (${response.status})`
        );
      }

      const { flowerId } = await response.json();

      // 5. Redirect to flower page
      router.push(`/flower/${flowerId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  };

  const isFormValid = file && topicName.trim() && flowerType;

  const GERMINATION_STEPS = [
    "Uploading your file",
    "Reading your content",
    "Building study units",
    "Growing your flower",
  ];

  // Loading state
  if (isSubmitting) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-xs flex-col items-center gap-8 text-center">
          {/* Bloomr logo with spinning ring */}
          <div className="relative flex h-[120px] w-[120px] items-center justify-center">
            {/* Spinning arc ring */}
            <svg
              className="absolute left-0 top-0 h-full w-full animate-spin"
              style={{ animationDuration: "2.4s", animationTimingFunction: "linear" }}
              viewBox="0 0 120 120"
            >
              <circle cx="60" cy="60" r="54" fill="none" stroke="#C8EDCF" strokeWidth="3" />
              <circle
                cx="60" cy="60" r="54"
                fill="none" stroke="#39AB54" strokeWidth="3"
                strokeDasharray="80 260" strokeLinecap="round"
              />
            </svg>
            {/* Pulsing Bloomr logo */}
            <svg
              className="animate-pulse"
              style={{ width: 68, height: 78, animationDuration: "2.4s" }}
              viewBox="0 0 469 532"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 0 C0.99 0.66 1.98 1.32 3 2 C3 2.66 3 3.32 3 4 C3.58483154 4.26409668 4.16966309 4.52819336 4.7722168 4.80029297 C7.08879263 6.04781665 8.72869907 7.39917198 10.64453125 9.1953125 C11.32193359 9.82953125 11.99933594 10.46375 12.69726562 11.1171875 C13.74430664 12.11105469 13.74430664 12.11105469 14.8125 13.125 C15.84213867 14.0840625 15.84213867 14.0840625 16.89257812 15.0625 C29.03675394 26.50582934 29.03675394 26.50582934 32 33 C32.66 33 33.32 33 34 33 C35.23339844 34.40185547 35.23339844 34.40185547 36.609375 36.3671875 C37.1137207 37.08261719 37.61806641 37.79804687 38.13769531 38.53515625 C38.66975586 39.30730469 39.20181641 40.07945313 39.75 40.875 C40.29495117 41.66003906 40.83990234 42.44507813 41.40136719 43.25390625 C49.25274824 54.63817357 56.59980048 66.79940143 61 80 C65.38159477 78.59659481 69.72559093 77.16143524 73.97265625 75.38671875 C82.70026069 71.74080833 91.4507616 68.8833032 100.625 66.5625 C101.63183838 66.30364014 102.63867676 66.04478027 103.67602539 65.77807617 C109.26968895 64.41735438 114.24528119 63.7197821 120 64 C128.27367493 90.64123326 127.47724714 123.3437925 121.3125 150.25 C121.0441333 151.42731689 120.7757666 152.60463379 120.49926758 153.81762695 C112.80659293 186.61886785 96.14239859 212.06907243 68 231 C66.90365234 231.75603516 66.90365234 231.75603516 65.78515625 232.52734375 C56.902365 238.40538532 47.12621753 242.15226496 37 245.25 C35.80938965 245.61919556 35.80938965 245.61919556 34.59472656 245.99584961 C27.67721597 248.02830683 21.29905693 248.87706817 14 250 C14.33 279.04 14.66 308.08 15 338 C17.64 334.37 20.28 330.74 23 327 C23.66 327 24.32 327 25 327 C25.24621094 326.43667969 25.49242187 325.87335938 25.74609375 325.29296875 C31.86004171 314.11263401 44.62365815 303.19870975 55 296 C55.66 296 56.32 296 57 296 C57 295.34 57 294.68 57 294 C59.17581938 292.36051705 61.34359514 290.85534119 63.625 289.375 C64.30216064 288.9305957 64.97932129 288.48619141 65.67700195 288.02832031 C87.44521596 273.88897591 109.59620607 264.20301543 135 259 C136.15072998 258.75008301 136.15072998 258.75008301 137.32470703 258.49511719 C150.50686775 255.72143667 163.77583467 255.71410461 177.1875 255.6875 C178.5414386 255.68198624 178.5414386 255.68198624 179.92272949 255.67636108 C189.16891061 255.65671384 197.99224771 255.65218502 207 258 C207.46924099 275.21573004 207.13474302 291.19747227 203 308 C202.64454022 309.57913656 202.29036374 311.15856257 201.9375 312.73828125 C196.42851972 336.3565951 185.97888888 357.06552105 171 376 C170.47019531 376.68449219 169.94039063 377.36898438 169.39453125 378.07421875 C168.31807887 379.42846529 167.16897108 380.72475883 166 382 C165.34 382 164.68 382 164 382 C163.67 382.99 163.34 383.98 163 385 C162.34 385 161.68 385 161 385 C160.67 385.99 160.34 386.98 160 388 C159.34 388 158.68 388 158 388 C157.67 388.99 157.34 389.98 157 391 C155.56396484 392.39111328 155.56396484 392.39111328 153.7109375 393.8203125 C153.02418945 394.35132568 152.33744141 394.88233887 151.62988281 395.42944336 C150.88577148 395.98897705 150.14166016 396.54851074 149.375 397.125 C148.61026367 397.7032251 147.84552734 398.2814502 147.05761719 398.87719727 C120.57100258 418.60529064 87.92505313 430.3874322 55 433 C54.24477051 433.06026367 53.48954102 433.12052734 52.71142578 433.18261719 C50.34999878 433.36459872 47.98825167 433.53107726 45.625 433.6875 C44.89224854 433.73624268 44.15949707 433.78498535 43.40454102 433.83520508 C38.24363912 434.12181956 38.24363912 434.12181956 36 433 C35.640902 422.50635832 36.19251779 409.65925313 42.58203125 400.80859375 C45.9541709 398.28629867 49.24544183 398.2054182 53.3125 397.9375 C54.94185333 397.79136009 56.57076719 397.64024246 58.19921875 397.484375 C59.01052246 397.40767578 59.82182617 397.33097656 60.65771484 397.25195312 C92.66050946 393.80950117 124.03830858 378.73326266 144.51171875 353.67919922 C156.52476953 338.47775311 163.64935446 322.00225407 168.39648438 303.33740234 C169.54782228 298.87829673 170.7800255 294.44072784 172 290 C142.70020697 291.36538378 115.09765176 295.89254535 90.265625 312.56640625 C88 314 88 314 86 314 C86 314.66 86 315.32 86 316 C84.1015625 317.5078125 84.1015625 317.5078125 81.625 319.125 C80.81289063 319.66382813 80.00078125 320.20265625 79.1640625 320.7578125 C77 322 77 322 75 322 C74.67 322.99 74.34 323.98 74 325 C72.2578125 326.7890625 72.2578125 326.7890625 70.125 328.625 C69.07699219 329.54152344 69.07699219 329.54152344 68.0078125 330.4765625 C66 332 66 332 63 333 C62.67 333.99 62.34 334.98 62 336 C61.34 336 60.68 336 60 336 C59.7421875 336.57234375 59.484375 337.1446875 59.21875 337.734375 C57.88634058 340.21128995 56.34943882 342.1341166 54.5 344.25 C53.8915625 344.95640625 53.283125 345.6628125 52.65625 346.390625 C51 348 51 348 49 348 C48.73316406 348.57105469 48.46632813 349.14210938 48.19140625 349.73046875 C46.94589811 352.10305966 45.51788817 354.14927363 43.9375 356.3125 C39.2247565 362.97500641 35.09370391 369.94705896 31 377 C30.35546875 378.09699219 29.7109375 379.19398438 29.046875 380.32421875 C19.69479886 396.85299679 15.01887635 415.83217137 14.79467773 434.79296875 C14.78477814 435.52565475 14.77487854 436.25834076 14.76467896 437.01322937 C14.73340981 439.40462147 14.70844533 441.79603336 14.68359375 444.1875 C14.66299424 445.85758951 14.64199704 447.52767416 14.62062073 449.19775391 C14.56570929 453.57061804 14.51616503 457.94352679 14.46777344 462.31646729 C14.41733103 466.78784098 14.36176426 471.25915075 14.30664062 475.73046875 C14.19943797 484.48692494 14.0979106 493.243435 14 502 C11.14992869 503.42503565 8.71379745 503.12980035 5.53125 503.1328125 C4.23832031 503.13410156 2.94539062 503.13539063 1.61328125 503.13671875 C0.93861816 503.13462402 0.26395508 503.1325293 -0.43115234 503.13037109 C-2.49193689 503.12502093 -4.55250349 503.13032035 -6.61328125 503.13671875 C-8.55267578 503.13478516 -8.55267578 503.13478516 -10.53125 503.1328125 C-11.72298828 503.13168457 -12.91472656 503.13055664 -14.14257812 503.12939453 C-17 503 -17 503 -19 502 C-20.16900672 498.49297983 -20.13893529 495.7146248 -20.15771484 492.01269531 C-20.16279556 491.30483383 -20.16787628 490.59697235 -20.17311096 489.86766052 C-20.18381159 488.32898444 -20.19243298 486.79029282 -20.19923019 485.25159454 C-20.2110618 482.80239407 -20.23053257 480.35336659 -20.25234985 477.90423584 C-20.31377151 470.93963553 -20.36767838 463.97504782 -20.40136719 457.01025391 C-20.42254161 452.74667179 -20.45803539 448.48339751 -20.50212479 444.21999359 C-20.51612253 442.6080162 -20.52496977 440.99598425 -20.52817917 439.38394928 C-20.5725789 419.19111181 -24.98565097 400.16204642 -34 382 C-34.49757812 380.96746094 -34.99515625 379.93492187 -35.5078125 378.87109375 C-38.63222849 372.44679421 -38.63222849 372.44679421 -42.375 366.375 C-44 364 -44 364 -44 362 C-44.66 362 -45.32 362 -46 362 C-47.4239869 360.28480923 -48.7663216 358.5012088 -50.0625 356.6875 C-51.13177734 355.20830078 -51.13177734 355.20830078 -52.22265625 353.69921875 C-54 351 -54 351 -55 348 C-55.66 348 -56.32 348 -57 348 C-58.65625 346.390625 -58.65625 346.390625 -60.5 344.25 C-61.1084375 343.55390625 -61.716875 342.8578125 -62.34375 342.140625 C-64 340 -64 340 -64.96875 337.859375 C-66.28430974 335.48738093 -67.57488373 335.12383437 -70 334 C-71.14442268 332.89437131 -72.24515744 331.74271097 -73.3125 330.5625 C-78.72425703 324.99872732 -84.99039219 320.650964 -91.31396484 316.1953125 C-92.65682343 315.2432946 -93.98203213 314.26639365 -95.30078125 313.28125 C-107.19672706 304.69900452 -121.97842698 298.96364019 -136 295 C-137.01964844 294.70480469 -138.03929687 294.40960938 -139.08984375 294.10546875 C-151.43809041 291.00695939 -164.34113629 290.7629287 -177 290 C-171.98558477 312.02628321 -166.45515559 333.10968386 -152 351 C-151.30132812 351.91136719 -150.60265625 352.82273437 -149.8828125 353.76171875 C-129.55280955 379.69875098 -97.19244772 393.53901922 -65.05859375 397.77685547 C-60.9202152 398.22544157 -56.7620437 398.36618571 -52.6015625 398.3984375 C-50 399 -50 399 -47.78515625 401.03515625 C-45.61115224 404.64581061 -44.70031885 407.97553645 -43.8125 412.0625 C-43.64814453 412.76955078 -43.48378906 413.47660156 -43.31445312 414.20507812 C-42.86695485 416.13457473 -42.43290366 418.06717661 -42 420 C-41.80019531 420.73734375 -41.60039062 421.4746875 -41.39453125 422.234375 C-40.66583079 425.49548992 -40.89083491 428.67046464 -41 432 C-42.9547544 433.9547544 -46.59151082 433.23961064 -49.25 433.25 C-79.36050588 433.23393592 -108.92416346 424.56875012 -135.0715332 410.04980469 C-137.02609588 408.98579412 -139.00409484 407.98391648 -141 407 C-141 406.34 -141 405.68 -141 405 C-141.58539551 404.88551514 -142.17079102 404.77103027 -142.77392578 404.65307617 C-163.0601019 398.70160424 -181.65718654 371.5905566 -191.37011719 354.18261719 C-201.21220921 335.86618743 -207.52314019 316.46972429 -211 296 C-211.30744141 294.42025391 -211.30744141 294.42025391 -211.62109375 292.80859375 C-213.63117883 281.28872686 -213.1867014 269.65303985 -213 258 C-202.48633226 255.97863544 -192.2384426 255.560807 -181.5625 255.5625 C-180.71460907 255.56110016 -179.86671814 255.55970032 -178.99313354 255.55825806 C-157.15320078 255.58768469 -135.56693795 258.30257458 -115 266 C-113.91847656 266.37769531 -112.83695312 266.75539063 -111.72265625 267.14453125 C-89.31660392 275.26502779 -69.57743297 288.13369242 -51.61767578 303.64111328 C-50.30213516 304.74619917 -48.92243338 305.7745542 -47.52734375 306.77734375 C-47.02332031 307.18082031 -46.51929688 307.58429688 -46 308 C-46 308.66 -46 309.32 -46 310 C-45.01 310.33 -44.02 310.66 -43 311 C-43 311.66 -43 312.32 -43 313 C-42.01 313.33 -41.02 313.66 -40 314 C-40 314.66 -40 315.32 -40 316 C-39.01 316.33 -38.02 316.66 -37 317 C-37 317.66 -37 318.32 -37 319 C-36.34 319 -35.68 319 -35 319 C-33.1084693 321.21418617 -31.32350321 323.43566984 -29.5625 325.75 C-29.07201172 326.38421875 -28.58152344 327.0184375 -28.07617188 327.671875 C-25.69094016 330.76205374 -23.34229842 333.87693543 -21 337 C-21 308.29 -21 279.58 -21 250 C-32.385 247.525 -32.385 247.525 -44 245 C-69.52515853 236.61582384 -90.15263673 221.73916835 -106 200 C-106.6496875 199.11699219 -107.299375 198.23398438 -107.96875 197.32421875 C-126.45359509 170.31113831 -131.81399867 135.00494777 -131 103 C-130.98743164 102.34628418 -130.97486328 101.69256836 -130.96191406 101.01904297 C-130.24357594 69.24357594 -130.24357594 69.24357594 -125 64 C-119.40872757 63.73637641 -114.43474011 64.31886006 -109 65.6875 C-108.26797363 65.86756592 -107.53594727 66.04763184 -106.78173828 66.2331543 C-94.63742458 69.28553119 -83.26565867 73.01919539 -72.01171875 78.546875 C-69.05404316 80.05278777 -69.05404316 80.05278777 -66 81 C-65.88785156 80.47535156 -65.77570313 79.95070313 -65.66015625 79.41015625 C-61.27768997 62.19537039 -50.13908716 46.31990871 -38.65625 33.09375 C-35.77547106 29.7697743 -33.08698002 26.31524853 -30.4375 22.8046875 C-29.04506825 21.05658025 -27.68264834 19.4723173 -26 18 C-25.34 18 -24.68 18 -24 18 C-23.67 17.01 -23.34 16.02 -23 15 C-22.34 15 -21.68 15 -21 15 C-21 14.34 -21 13.68 -21 13 C-18.52987625 10.45104251 -15.73886261 8.25361267 -13 6 C-12.29488281 5.40832031 -11.58976563 4.81664062 -10.86328125 4.20703125 C-10.18652344 3.66433594 -9.50976562 3.12164062 -8.8125 2.5625 C-8.20019531 2.06878906 -7.58789062 1.57507813 -6.95703125 1.06640625 C-4.4437093 -0.30312846 -2.82524656 -0.3289362 0 0 Z"
                fill="#39AB54"
                transform="translate(239,10)"
              />
            </svg>
          </div>

          {/* Title */}
          <div>
            <h2 className="font-heading text-2xl font-semibold text-[#3D2B1F]">
              Your seed is germinating...
            </h2>
            <p className="mt-2 text-sm text-[#6B4C35]">
              This may take a minute while we prepare your personalised units.
            </p>
          </div>

          {/* Progress steps */}
          <div className="flex w-full flex-col gap-2">
            {GERMINATION_STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-500 ${
                    isActive
                      ? "border border-[#39AB54]/30 bg-[#C8EDCF]/40"
                      : isCompleted
                        ? "opacity-60"
                        : "opacity-25"
                  }`}
                >
                  {/* Status icon */}
                  <div className="h-5 w-5 flex-shrink-0">
                    {isCompleted ? (
                      <svg viewBox="0 0 20 20" fill="#39AB54">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : isActive ? (
                      <svg className="animate-spin" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="8" stroke="#C8EDCF" strokeWidth="2.5" />
                        <path d="M10 2a8 8 0 018 8" stroke="#39AB54" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-[#C4BAA8]" />
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-[#3D2B1F]" : "text-[#6B4C35]"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold text-[#3D2B1F] md:text-4xl">
          Plant a new flower
        </h1>
        <p className="mt-2 text-[#6B4C35]">
          Upload your lecture notes and watch your knowledge bloom.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* File Upload Zone */}
        <Card className="rounded-2xl border-[#C4BAA8]">
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                relative flex w-full cursor-pointer flex-col items-center justify-center
                rounded-2xl border-2 border-dashed p-8 transition-colors
                ${
                  isDragging
                    ? "border-[#39AB54] bg-[#C8EDCF]/30"
                    : file
                      ? "border-[#39AB54] bg-[#C8EDCF]/10"
                      : "border-[#C4BAA8] hover:border-[#39AB54]/50 hover:bg-[#C8EDCF]/10"
                }
              `}
            >
              {/* Seed icon */}
              <div
                className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  file ? "bg-[#C8EDCF]" : "bg-[#EDE8DE]"
                }`}
              >
                {file ? (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#39AB54"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6B4C35"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22c4-4 8-7.5 8-12a8 8 0 0 0-16 0c0 4.5 4 8 8 12z" />
                    <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                  </svg>
                )}
              </div>

              {file ? (
                <div className="text-center">
                  <p className="font-medium text-[#3D2B1F]">{file.name}</p>
                  <p className="mt-1 text-sm text-[#6B4C35]">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="mt-2 text-xs text-[#39AB54]">
                    Click or drop to replace
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="font-medium text-[#3D2B1F]">
                    Drop your lecture PDF here
                  </p>
                  <p className="mt-1 text-sm text-[#6B4C35]">
                    or click to browse
                  </p>
                  <Badge variant="outline" className="mt-3">
                    PDF only
                  </Badge>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </button>
          </CardContent>
        </Card>

        {/* Topic Name */}
        <div>
          <label
            htmlFor="topic-name"
            className="mb-2 block text-sm font-medium text-[#3D2B1F]"
          >
            Topic name
          </label>
          <Input
            id="topic-name"
            type="text"
            placeholder="e.g. Organic Chemistry, World War II, Linear Algebra"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            className="h-11 rounded-xl border-[#C4BAA8] bg-white px-4 text-[#3D2B1F] placeholder:text-[#C4BAA8]"
          />
        </div>

        {/* Flower Type Selector */}
        <div>
          <label className="mb-3 block text-sm font-medium text-[#3D2B1F]">
            Choose your flower
          </label>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {FLOWER_TYPES.map((flower) => (
              <button
                key={flower.name}
                type="button"
                onClick={() => setFlowerType(flower.name)}
                className={`
                  group flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all sm:p-4
                  ${
                    flowerType === flower.name
                      ? "border-[#39AB54] bg-[#C8EDCF]/20 ring-2 ring-[#39AB54]/20"
                      : "border-[#C4BAA8] bg-[#EDE8DE] hover:border-[#39AB54]/40"
                  }
                `}
              >
                <div
                  className={`h-8 w-8 rounded-full transition-transform sm:h-10 sm:w-10 ${
                    flowerType === flower.name ? "scale-110" : "group-hover:scale-105"
                  }`}
                  style={{ backgroundColor: flower.color }}
                />
                <span
                  className={`text-xs font-medium sm:text-sm ${
                    flowerType === flower.name
                      ? "text-[#3D2B1F]"
                      : "text-[#6B4C35]"
                  }`}
                >
                  {flower.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl border border-[#E8637A]/30 bg-[#E8637A]/5 px-4 py-3">
            <p className="text-sm text-[#E8637A]">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`
            h-12 w-full rounded-full text-base font-semibold text-white transition-all
            ${
              isFormValid
                ? "bg-[#39AB54] hover:bg-[#2A8040] active:bg-[#238536]"
                : "bg-[#C4BAA8] cursor-not-allowed"
            }
          `}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M12 22c4-4 8-7.5 8-12a8 8 0 0 0-16 0c0 4.5 4 8 8 12z" />
            <path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
          </svg>
          Plant Your Seed
        </Button>
      </div>
    </div>
  );
}
