import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat';

export const useChatUsers = () => {
  return useQuery({
    queryKey: ['chatUsers'],
    queryFn: async () => {
      const response = await chatApi.getChatUsers();
      if (!response.success) throw new Error('Failed to fetch chat users');
      return response.data;
    },
    refetchInterval: 10000, // Poll every 10 seconds for unread counts
  });
};

export const useChatMessages = (userId) => {
  return useQuery({
    queryKey: ['chatMessages', userId],
    queryFn: async () => {
      const response = await chatApi.getChatHistory(userId);
      if (!response.success) throw new Error('Failed to fetch messages');
      // After fetching successfully, mark them as read in the background
      chatApi.markAsRead(userId);
      return response.data;
    },
    enabled: !!userId,
    refetchInterval: 3000, // Poll for new messages
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ receiver_id, message }) => {
      const response = await chatApi.sendMessage({ receiver_id, message });
      if (!response.success) throw new Error('Failed to send message');
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Optimistically update or refetch
      queryClient.invalidateQueries({ queryKey: ['chatMessages', variables.receiver_id] });
      queryClient.invalidateQueries({ queryKey: ['chatUsers'] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageId }) => {
      const response = await chatApi.deleteMessage(messageId);
      if (!response.success) throw new Error('Failed to delete message');
      return messageId;
    },
    onSuccess: (deletedMessageId) => {
      // Could manually filter from cache, or simply invalidate
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
    },
  });
};

export const useClearChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      const response = await chatApi.clearChat(userId);
      if (!response.success) throw new Error('Failed to clear chat');
      return userId;
    },
    onSuccess: (userId) => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', userId] });
    },
  });
};
