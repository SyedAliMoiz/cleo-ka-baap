'use client';

import React from 'react';
import { Text, Badge } from '@mantine/core';
import { Client } from '../../utils/clientService';
import { useDarkMode } from '../DarkModeProvider';

interface ClientCardProps {
  client: Client;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Card component for displaying client information
 */
export function ClientCard({ client, isSelected, onClick }: ClientCardProps) {
  const { isDarkMode } = useDarkMode();
  const logoPlaceholder = client.name.charAt(0);
  
  // Direct style with !important to override any specificity issues
  const cardStyle = {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    margin: '12px 0',
    borderRadius: '12px',
    border: `2px solid ${isSelected ? (isDarkMode ? '#a78bfa' : '#4f46e5') : (isDarkMode ? 'rgba(90, 50, 140, 0.3)' : '#e5e7eb')}`,
    backgroundColor: isSelected ? (isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(79, 70, 229, 0.08)') : (isDarkMode ? 'rgba(30, 30, 40, 0.7)' : 'white'),
    cursor: 'pointer',
    position: 'relative' as const,
    boxShadow: isSelected ? `0 0 0 2px ${isDarkMode ? '#a78bfa' : '#4f46e5'}` : 'none',
    transform: isSelected ? 'translateY(-2px)' : 'none',
    transition: 'all 0.2s ease !important',
  };

  const avatarStyle = {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: isDarkMode ? '#7e22ce' : '#6366f1',
    color: 'white',
    display: 'flex',
    alignItems: 'center', 
    justifyContent: 'center',
    fontSize: '22px',
    fontWeight: 700,
    marginRight: '16px',
    flexShrink: 0,
  };
  
  const contentStyle = {
    flex: 1,
    minWidth: 0,
  };
  
  const nameStyle = {
    fontSize: '18px',
    fontWeight: 700,
    color: isDarkMode ? '#e2e8f0' : '#1f2937',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
  
  const badgeStyle = {
    position: 'absolute' as const,
    top: '12px',
    right: '18px',
    backgroundColor: isDarkMode ? '#7e22ce' : '#818cf8',
    color: 'white',
    padding: '2px 10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
  };

  return (
    <div 
      onClick={onClick}
      style={cardStyle}
      className="client-card-hover" // Add a class for extra CSS
      data-selected={isSelected ? "true" : "false"} // For CSS selectors
      onMouseEnter={(e) => {
        // Force hover styles directly on element
        const el = e.currentTarget;
        el.style.backgroundColor = isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(79, 70, 229, 0.08)';
        el.style.borderColor = isDarkMode ? '#a78bfa' : '#4f46e5';
        el.style.transform = 'translateY(-3px)';
        el.style.boxShadow = `0 8px 16px rgba(0, 0, 0, ${isDarkMode ? '0.25' : '0.1'})`;
      }}
      onMouseLeave={(e) => {
        // Reset styles on leave
        const el = e.currentTarget;
        el.style.backgroundColor = isSelected ? (isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(79, 70, 229, 0.08)') : (isDarkMode ? 'rgba(30, 30, 40, 0.7)' : 'white');
        el.style.borderColor = isSelected ? (isDarkMode ? '#a78bfa' : '#4f46e5') : (isDarkMode ? 'rgba(90, 50, 140, 0.3)' : '#e5e7eb');
        el.style.transform = isSelected ? 'translateY(-2px)' : 'none';
        el.style.boxShadow = isSelected ? `0 0 0 2px ${isDarkMode ? '#a78bfa' : '#4f46e5'}` : 'none';
      }}
    >
      <style jsx>{`
        .client-card-hover:hover {
          background-color: ${isDarkMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(79, 70, 229, 0.08)'} !important;
          border-color: ${isDarkMode ? '#a78bfa' : '#4f46e5'} !important;
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 16px rgba(0, 0, 0, ${isDarkMode ? '0.25' : '0.1'}) !important;
        }
      `}</style>
      
      <div style={avatarStyle}>
        {logoPlaceholder}
      </div>
      
      <div style={contentStyle}>
        <div style={nameStyle}>
          {client.name}
        </div>
        
        {client.industry && (
          <Badge color={isDarkMode ? 'grape' : 'blue'} variant={isDarkMode ? 'light' : 'filled'} size="sm" mt={4}>
            {client.industry}
          </Badge>
        )}
        
        {client.bio && (
          <Text size="sm" mt={4} c={isDarkMode ? 'gray.4' : 'gray.7'} truncate>
            {client.bio}
          </Text>
        )}
      </div>
      
      {isSelected && (
        <div style={badgeStyle}>
          Selected
        </div>
      )}
    </div>
  );
} 