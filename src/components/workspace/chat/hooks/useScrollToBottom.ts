import { useRef, useEffect } from 'react';

export function useScrollToBottom(dependency: number) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dependency]);

  return { messagesEndRef, scrollToBottom };
}
