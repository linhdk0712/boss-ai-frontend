import { ref, computed } from 'vue'
import { contentService } from '@/services/contentService'
import { useVideoProgress } from '@/composables/useVideoProgress'
import type {
    ContentGenerateRequest,
    ContentGenerateResponse,
    ContentSaveRequest,
    ContentGenerationDto,
    ContentWorkflowRequest,
    GenerationStats
} from '@/types/content'

/**
 * Composable for content generation operations
 * Handles AI content generation, saving, and workflow triggers
 */
export function useContentGeneration() {
    // Video progress tracking
    const { addVideoJob } = useVideoProgress()
    // State for generated content
    const generatedContent = ref<ContentGenerateResponse | null>(null)
    const lastGenerateRequest = ref<ContentGenerateRequest | null>(null)

    // Operation states
    const generating = ref(false)
    const saving = ref(false)
    const creatingVideo = ref(false)

    // Error states
    const generateError = ref<string | null>(null)
    const saveError = ref<string | null>(null)
    const videoError = ref<string | null>(null)

    // Computed properties
    const hasGeneratedContent = computed(() => !!generatedContent.value)

    const generationStats = computed((): GenerationStats | null => {
        if (!generatedContent.value) return null

        return {
            wordCount: generatedContent.value.wordCount,
            characterCount: generatedContent.value.characterCount,
            tokensUsed: generatedContent.value.tokensUsed,
            generationCost: generatedContent.value.generationCost,
            processingTimeMs: generatedContent.value.processingTimeMs,
        }
    })

    const canSave = computed(() =>
        hasGeneratedContent.value && !saving.value
    )

    const canRegenerate = computed(() =>
        !!lastGenerateRequest.value && !generating.value
    )

    const canCreateVideo = computed(() =>
        hasGeneratedContent.value && !creatingVideo.value
    )

    /**
     * Generate AI content based on user input and configuration
     */
    const generateContent = async (request: ContentGenerateRequest) => {
        try {
            generating.value = true
            generateError.value = null

            // Store request for regeneration
            lastGenerateRequest.value = { ...request }

            const response = await contentService.generateContent(request)

            if (response.errorCode === 'SUCCESS') {
                // Check if the generation actually succeeded
                if (response.data.status === 'FAILED' || !response.data.generatedContent) {
                    // OpenAI generation failed
                    generateError.value = response.data.errorMessage || 'Content generation failed'
                    generatedContent.value = null
                } else {
                    // Generation succeeded
                    generatedContent.value = response.data
                }
            } else {
                generateError.value = response.errorMessage
            }
        } catch (err: any) {
            generateError.value = err.response?.data?.errorMessage || err.message || 'Failed to generate content'
            console.error('Content generation failed:', err)
        } finally {
            generating.value = false
        }
    }

    /**
     * Regenerate content using the last request parameters
     */
    const regenerateContent = async () => {
        if (!lastGenerateRequest.value) {
            generateError.value = 'No previous generation request found'
            return
        }

        await generateContent(lastGenerateRequest.value)
    }

    /**
     * Save generated content to user's library
     */
    const saveContent = async (title: string): Promise<ContentGenerationDto | null> => {
        if (!generatedContent.value || !lastGenerateRequest.value) {
            saveError.value = 'No content to save'
            return null
        }

        try {
            saving.value = true
            saveError.value = null

            const saveRequest: ContentSaveRequest = {
                title,
                content: lastGenerateRequest.value.content,
                generatedContent: generatedContent.value.generatedContent,
                industry: lastGenerateRequest.value.industry,
                contentType: lastGenerateRequest.value.contentType,
                language: lastGenerateRequest.value.language || 'vi',
                tone: lastGenerateRequest.value.tone,
                targetAudience: lastGenerateRequest.value.targetAudience,
            }

            const response = await contentService.saveContent(saveRequest)

            if (response.errorCode === 'SUCCESS') {
                return response.data
            } else {
                saveError.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            saveError.value = err.response?.data?.errorMessage || err.message || 'Failed to save content'
            console.error('Content save failed:', err)
            return null
        } finally {
            saving.value = false
        }
    }

    /**
     * Trigger video generation workflow
     */
    const triggerWorkflow = async (title?: string): Promise<any> => {
        if (!generatedContent.value) {
            videoError.value = 'No content available for video generation'
            return null
        }

        try {
            creatingVideo.value = true
            videoError.value = null

            const workflowRequest: ContentWorkflowRequest = {
                content: generatedContent.value.generatedContent,
                title: title || generatedContent.value.title,
                contentType: lastGenerateRequest.value?.contentType || 'general',
                industry: lastGenerateRequest.value?.industry,
                language: lastGenerateRequest.value?.language,
                tone: lastGenerateRequest.value?.tone,
                targetAudience: lastGenerateRequest.value?.targetAudience,
            }

            const response = await contentService.triggerWorkflow(workflowRequest)

            if (response.errorCode === 'SUCCESS') {
                // Create a mock content object for video progress tracking
                const videoContent: ContentGenerationDto = {
                    id: Date.now(), // Temporary ID until we get the real one from backend
                    title: workflowRequest.title || 'Video Content',
                    generatedContent: workflowRequest.content,
                    contentType: workflowRequest.contentType,
                    status: 'WORKFLOW_TRIGGERED',
                    startedAt: new Date().toISOString(),
                    // Add other required fields with default values
                    user: {} as any,
                    aiProvider: 'OpenAI',
                    aiModel: 'gpt-3.5-turbo',
                    wordCount: 0,
                    characterCount: 0,
                    industry: workflowRequest.industry || '',
                    targetAudience: workflowRequest.targetAudience || '',
                    tone: workflowRequest.tone || '',
                    language: workflowRequest.language || 'vi',
                    retryCount: 0,
                    maxRetries: 3,
                    isBillable: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    currentVersion: 1
                }

                // Add to video progress tracking
                addVideoJob(videoContent)

                return response.data
            } else {
                videoError.value = response.errorMessage
                return null
            }
        } catch (err: any) {
            videoError.value = err.response?.data?.errorMessage || err.message || 'Failed to create video'
            console.error('Video workflow failed:', err)
            return null
        } finally {
            creatingVideo.value = false
        }
    }

    /**
     * Clear generated content and reset state
     */
    const clearContent = () => {
        generatedContent.value = null
        lastGenerateRequest.value = null
        generateError.value = null
        saveError.value = null
        videoError.value = null
    }

    /**
     * Reset all error states
     */
    const clearErrors = () => {
        generateError.value = null
        saveError.value = null
        videoError.value = null
    }

    /**
     * Check if any operation is currently running
     */
    const isAnyOperationRunning = computed(() =>
        generating.value || saving.value || creatingVideo.value
    )

    return {
        // State
        generatedContent,
        lastGenerateRequest,

        // Operation states
        generating,
        saving,
        creatingVideo,

        // Error states
        generateError,
        saveError,
        videoError,

        // Computed properties
        hasGeneratedContent,
        generationStats,
        canSave,
        canRegenerate,
        canCreateVideo,
        isAnyOperationRunning,

        // Methods
        generateContent,
        regenerateContent,
        saveContent,
        triggerWorkflow,
        clearContent,
        clearErrors,
    }
}