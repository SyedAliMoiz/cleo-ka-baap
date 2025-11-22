"use client";

import { Article } from "./newsService";
import { apiHelpers } from "./apiClient";

/**
 * Interface for the client information required for content generation
 */
export interface ClientInfo {
  id: string;
  name: string;
  bio?: string;
  nicheTags?: string[];
  businessInfo?: string;
  industry?: string;
  voice?: string;
}

/**
 * Interface for article with ranking information
 */
export interface RankedArticle extends Article {
  rank: number;
  explanation?: string;
}

/**
 * Interface for ranking response
 */
export interface RankingResponse {
  topArticles: RankedArticle[];
  clientId: string;
  topic: string;
  timestamp: string;
}

/**
 * Interface for content angle with engagement score
 */
export interface ContentAngle {
  title: string;
  explanation: string;
  engagementScore: number;
}

/**
 * Interface for angle generation response
 */
export interface AngleResponse {
  angles: ContentAngle[];
  recommendedAngle: ContentAngle;
}

/**
 * Interface for social media hook
 */
export interface Hook {
  text: string;
  explanation?: string;
  isRecommended?: boolean;
}

/**
 * Interface for hook generation response
 */
export interface HookResponse {
  hooks: Hook[];
  recommendedHook: Hook;
}

/**
 * Interface for thread generation response
 */
export interface ThreadResponse {
  thread: string;
}

/**
 * Interface for thread generation request
 */
export interface ThreadRequest {
  topic: string;
  clientInfo: ClientInfo;
  clientId?: string;
  research: string;
  selectedArticle?: Article;
  selectedAngle: ContentAngle;
  selectedHook: Hook;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Interface for post regeneration request
 */
export interface RegeneratePostRequest {
  threadData: ThreadRequest;
}

/**
 * Interface for post regeneration response
 */
export interface RegeneratePostResponse {
  thread: string;
}

/**
 * Interface for a message in the conversation
 */
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  isHidden?: boolean;
}

/**
 * Interface for conversational edit request
 */
export interface ConversationalEditRequest {
  threadData: ThreadRequest;
  thread: string;
  userMessage: string;
  conversationHistory: Message[];
}

/**
 * Interface for conversational edit response
 */
export interface ConversationalEditResponse {
  response: string;
  thread: string;
  conversationHistory: Message[];
}

/**
 * Interface for saving thread request
 */
export interface SaveThreadRequest {
  threadData: ThreadRequest;
  thread: string;
  conversationHistory: Message[];
}

/**
 * Interface for saving thread response
 */
export interface SaveThreadResponse {
  id: string;
  message: string;
}

/**
 * Interface for hook polishing request
 */
export interface HookPolishRequest {
  hook: string;
  threadContext?: string;
  research?: string;
  angle?: string;
  conversationHistory?: Message[];
}

/**
 * Interface for hook polishing response
 */
export interface HookPolishResponse {
  polishedHooks: Hook[];
  response: string;
  conversationHistory: Message[];
}

/**
 * Service for generating content using Anthropic Claude API
 */
export class ContentGenerationService {
  private static instance: ContentGenerationService;

  private constructor() {}

  /**
   * Sanitize an article by removing properties not expected by the backend
   * @param article The article to sanitize
   * @returns A sanitized copy of the article with only valid properties
   */
  private sanitizeArticle(article: Article | RankedArticle): Article {
    if (!article) return null;

    // Create a new object with only the properties expected by the backend
    const sanitized: Article = {
      title: article.title,
      url: article.url,
      summary: article.summary,
      publishedAt: article.publishedAt,
      source: article.source,
    };

    return sanitized;
  }

  /**
   * Get the singleton instance of the ContentGenerationService
   * @returns The ContentGenerationService instance
   */
  public static getInstance(): ContentGenerationService {
    if (!ContentGenerationService.instance) {
      ContentGenerationService.instance = new ContentGenerationService();
    }
    return ContentGenerationService.instance;
  }

  /**
   * Rank articles based on client info and topic
   * @param articles The articles to rank
   * @param clientInfo The client information
   * @param topic The topic to focus on
   * @param cacheKey Optional cache key to prevent caching
   * @returns Promise with ranked articles
   */
  async rankArticles(
    articles: Article[],
    clientInfo: ClientInfo,
    topic: string,
    cacheKey?: string
  ): Promise<RankingResponse> {
    try {
      const response = await apiHelpers.post<RankingResponse>(
        "/api/anthropic/rank-articles",
        {
          articles,
          clientId: clientInfo.id,
          topic,
          cacheKey,
        }
      );
      return response;
    } catch (error) {
      console.error("Error ranking articles:", error);
      throw error;
    }
  }

  /**
   * Generate content angles based on research and client info
   * @param topic The topic to generate angles for
   * @param clientInfo The client information
   * @param research The research to base angles on
   * @param selectedArticle Optional article to focus on
   * @param isManualMode Whether using manual research mode
   * @param manualResearch Optional manual research content
   * @param customInstructions Optional custom instructions
   * @returns Promise with generated angles
   */
  async generateAngles(
    topic: string,
    clientInfo: ClientInfo,
    research: string,
    selectedArticle?: Article,
    isManualMode = false,
    manualResearch = "",
    customInstructions = ""
  ): Promise<AngleResponse> {
    try {
      // Sanitize the article if it exists to remove any extra properties
      const sanitizedArticle = selectedArticle
        ? this.sanitizeArticle(selectedArticle)
        : undefined;

      const response = await apiHelpers.post<AngleResponse>(
        "/api/anthropic/generate-angles",
        {
          topic,
          clientId: clientInfo.id,
          research,
          selectedArticle: sanitizedArticle,
          isManualMode,
          manualResearch,
          customInstructions,
        }
      );
      return response;
    } catch (error) {
      console.error("Error generating angles:", error);
      throw error;
    }
  }

  /**
   * Generate hooks for social media content
   * @param topic The topic to generate hooks for
   * @param clientInfo The client information
   * @param selectedAngle The selected content angle
   * @param research The research to base hooks on
   * @param selectedArticle Optional article to focus on
   * @param customInstructions Optional custom instructions
   * @returns Promise with generated hooks
   */
  async generateHooks(
    topic: string,
    clientInfo: ClientInfo,
    selectedAngle: ContentAngle,
    research: string,
    selectedArticle?: Article,
    customInstructions = ""
  ): Promise<HookResponse> {
    try {
      // Sanitize the article if it exists
      const sanitizedArticle = selectedArticle
        ? this.sanitizeArticle(selectedArticle)
        : undefined;

      const response = await apiHelpers.post<HookResponse>(
        "/api/anthropic/generate-hooks",
        {
          topic,
          clientId: clientInfo.id, // Only send the client ID instead of the full object
          selectedAngle,
          research,
          selectedArticle: sanitizedArticle,
          customInstructions,
        }
      );
      return response;
    } catch (error) {
      console.error("Error generating hooks:", error);
      throw error;
    }
  }

  /**
   * Generate a complete X thread based on the provided data
   * @param threadRequest The thread generation request
   * @returns Promise with the generated thread as a single text
   */
  async generateThread(threadRequest: ThreadRequest): Promise<ThreadResponse> {
    try {
      // Create a sanitized copy of the request with clean article data and only client ID
      const sanitizedRequest = {
        ...threadRequest,
        clientId: threadRequest.clientInfo.id, // Only send the client ID
        selectedArticle: threadRequest.selectedArticle
          ? this.sanitizeArticle(threadRequest.selectedArticle)
          : undefined,
      };

      // Remove the full clientInfo object
      delete sanitizedRequest.clientInfo;

      const response = await apiHelpers.post<ThreadResponse>(
        "/api/thread-writer/thread",
        sanitizedRequest
      );
      return response;
    } catch (error) {
      console.error("Error generating thread:", error);
      throw error;
    }
  }

  /**
   * Regenerate a thread
   * @param regenerateRequest The thread regeneration request
   * @returns Promise with the regenerated thread content
   */
  async regeneratePost(
    regenerateRequest: RegeneratePostRequest
  ): Promise<RegeneratePostResponse> {
    try {
      // Create a copy of the thread data with only client ID
      const threadDataWithClientId = {
        ...regenerateRequest.threadData,
        clientId: regenerateRequest.threadData.clientInfo.id,
        selectedArticle: regenerateRequest.threadData.selectedArticle
          ? this.sanitizeArticle(regenerateRequest.threadData.selectedArticle)
          : undefined,
      };

      // Remove the full clientInfo object
      delete threadDataWithClientId.clientInfo;

      const sanitizedRequest = {
        threadData: threadDataWithClientId,
      };

      const response = await apiHelpers.post<RegeneratePostResponse>(
        "/api/thread-writer/regenerate-post",
        sanitizedRequest
      );
      return response;
    } catch (error) {
      console.error("Error regenerating thread:", error);
      throw error;
    }
  }

  /**
   * Edit a thread conversationally
   * @param editRequest The conversational edit request
   * @returns Promise with the updated thread and conversation
   */
  async conversationalThreadEdit(
    editRequest: ConversationalEditRequest
  ): Promise<ConversationalEditResponse> {
    try {
      // Create a copy of the thread data with only client ID
      const threadDataWithClientId = {
        ...editRequest.threadData,
        clientId: editRequest.threadData.clientInfo.id,
        selectedArticle: editRequest.threadData.selectedArticle
          ? this.sanitizeArticle(editRequest.threadData.selectedArticle)
          : undefined,
      };

      // Remove the full clientInfo object
      delete threadDataWithClientId.clientInfo;

      const sanitizedRequest = {
        ...editRequest,
        threadData: threadDataWithClientId,
      };

      const response = await apiHelpers.post<ConversationalEditResponse>(
        "/api/thread-writer/conversational-edit",
        sanitizedRequest
      );
      return response;
    } catch (error) {
      console.error("Error with conversational edit:", error);
      throw error;
    }
  }

  /**
   * Complete a prompt directly using Anthropic Claude API
   * @param prompt The prompt to complete
   * @param maxTokens Optional maximum tokens to generate
   * @param temperature Optional sampling temperature
   * @returns Promise with the completion response
   */
  async complete(
    prompt: string,
    maxTokens?: number,
    temperature?: number
  ): Promise<{ text: string }> {
    try {
      const response = await apiHelpers.post<{ text: string }>(
        "/api/anthropic/complete",
        {
          prompt,
          maxTokens,
          temperature,
        }
      );
      return response;
    } catch (error) {
      console.error("Error completing prompt:", error);
      throw error;
    }
  }

  /**
   * Save a thread with conversation history
   * @param saveRequest The thread data to save
   * @returns Promise with the saved thread ID and confirmation message
   */
  async saveThread(
    saveRequest: SaveThreadRequest
  ): Promise<SaveThreadResponse> {
    try {
      // Create a copy of the thread data with only client ID
      const threadDataWithClientId = {
        ...saveRequest.threadData,
        clientId: saveRequest.threadData.clientInfo.id,
        selectedArticle: saveRequest.threadData.selectedArticle
          ? this.sanitizeArticle(saveRequest.threadData.selectedArticle)
          : undefined,
      };

      // Remove the full clientInfo object
      delete threadDataWithClientId.clientInfo;

      const sanitizedRequest = {
        ...saveRequest,
        threadData: threadDataWithClientId,
      };

      const response = await apiHelpers.post<SaveThreadResponse>(
        "/api/thread-writer/save-thread",
        sanitizedRequest
      );
      return response;
    } catch (error) {
      console.error("Error saving thread:", error);
      throw error;
    }
  }

  /**
   * Polish a hook using the dedicated hook polisher chat service
   * @param polishRequest The request containing hook and context information
   * @param clientId Optional client ID to associate with the chat
   * @returns Promise with the chat ID for the hook polishing workflow
   */
  async polishHook(
    polishRequest: HookPolishRequest,
    clientId?: string
  ): Promise<{ chatId: string; isNew: boolean }> {
    try {
      const response = await apiHelpers.post<{
        chatId: string;
        isNew: boolean;
      }>("/api/hook-polisher-chats/create-or-get", {
        hook: polishRequest.hook,
        threadContext: polishRequest.threadContext,
        research: polishRequest.research,
        angle: polishRequest.angle,
        clientId,
      });
      return response;
    } catch (error) {
      console.error("Error polishing hook:", error);
      throw error;
    }
  }

  /**
   * Continue a conversation about hook polishing
   * @param chatId The hook polisher chat ID
   * @param message The user message to send
   * @returns Promise with the AI response and updated hooks
   */
  async conversationalHookPolish(
    chatId: string,
    message: string
  ): Promise<{ response: string; polishedHooks?: Hook[] }> {
    try {
      const response = await apiHelpers.post<{
        response: string;
        polishedHooks?: Hook[];
      }>(`/api/hook-polisher-chats/${chatId}/message`, {
        message,
      });
      return response;
    } catch (error) {
      console.error("Error in hook polishing conversation:", error);
      throw error;
    }
  }

  /**
   * Get hook polisher chat data including polished hooks and conversation history
   * @param chatId The hook polisher chat ID
   * @returns Promise with the complete chat data
   */
  async getHookPolisherChat(chatId: string): Promise<{
    originalHook: string;
    threadContext?: string;
    research?: string;
    angle?: string;
    polishedHooks: Hook[];
    conversationHistory: Message[];
    lastActivity: string;
  }> {
    try {
      const response = await apiHelpers.get<{
        originalHook: string;
        threadContext?: string;
        research?: string;
        angle?: string;
        polishedHooks: Hook[];
        conversationHistory: Message[];
        lastActivity: string;
      }>(`/api/hook-polisher-chats/${chatId}`);
      return response;
    } catch (error) {
      console.error("Error getting hook polisher chat:", error);
      throw error;
    }
  }
}
