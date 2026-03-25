#!/usr/bin/env npx tsx

import { generateModel, uploadImageToFal } from '../../../../scripts/api/fal'
import { validateImage, saveModel } from '../../../../scripts/utils/file-manager'
import { MODELS_DIR, ensureDirectories } from '../../../../scripts/utils/path-resolver'

interface Generate3DModelInput {
  imagePath: string
  description: string
  prompt?: string
}

interface Generate3DModelOutput {
  modelPath: string // Now returns local path, not URL
  imagePath: string
  description: string
}

async function main() {
  try {
    // Parse JSON input from command line argument
    const input: Generate3DModelInput = JSON.parse(process.argv[2] || '{}')

    if (!input.imagePath) {
      throw new Error('imagePath is required')
    }

    if (!input.description) {
      throw new Error('description is required')
    }

    // Validate that the image file exists
    console.error('Validating image file...')
    if (!validateImage(input.imagePath)) {
      throw new Error(`Image not found or invalid: ${input.imagePath}`)
    }

    // Convert image to data URL for Fal.ai
    console.error('Uploading image to Fal.ai...')
    const imageUrl = uploadImageToFal(input.imagePath)

    // Generate 3D model
    console.error('Generating 3D model (this will take 30-60 seconds)...')
    const result = await generateModel({
      imageUrl,
      prompt: input.prompt || input.description, // Use description as fallback
    })

    // NEW: Download the model automatically
    console.error('Downloading GLB model...')
    ensureDirectories()
    const localPath = await saveModel({
      url: result.modelUrl,
      description: input.description,
      directory: MODELS_DIR,
    })

    console.error(`Model saved to: ${localPath}`)

    // Return local path instead of URL
    const output: Generate3DModelOutput = {
      modelPath: localPath, // Changed from URL to local path
      imagePath: input.imagePath,
      description: input.description,
    }

    console.log(JSON.stringify(output, null, 2))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(JSON.stringify({ error: errorMessage }))
    process.exit(1)
  }
}

main()
