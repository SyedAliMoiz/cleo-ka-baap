'use client';

import React from 'react';
import { Text, useMantineTheme } from '@mantine/core';
import { useDarkMode } from '../DarkModeProvider';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepNames?: string[];
}

/**
 * A reusable component that displays the current step in a multi-step process
 * with numbered indicators and optional step names.
 */
export function StepIndicator({ 
  currentStep, 
  totalSteps,
  stepNames = [
    'Client Selection',
    'Topic Selection',
    'Research Method',
    'Article Ranking',
    'Research Generation',
    'Angle Selection',
    'Hook Generation',
    'Thread Writing',
    'Finalize'
  ]
}: StepIndicatorProps) {
  const { isDarkMode } = useDarkMode();
  const theme = useMantineTheme();
  
  const primaryColor = isDarkMode ? theme.colors.grape[4] : theme.colors.indigo[6];
  const primaryLightColor = isDarkMode ? 'rgba(90, 50, 140, 0.3)' : theme.colors.indigo[0];
  const textColor = isDarkMode ? theme.colors.gray[4] : theme.colors.gray[6];
  const completedColor = isDarkMode ? theme.colors.grape[5] : theme.colors.indigo[6];
  const incompleteBgColor = isDarkMode ? 'rgba(30, 30, 40, 0.5)' : theme.colors.gray[2];
  const progressBarBgColor = isDarkMode ? 'rgba(30, 30, 40, 0.5)' : theme.colors.gray[2];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <Text size="sm" c={textColor} fw={500}>
          Step {currentStep} of {totalSteps}
        </Text>
        <Text size="sm" c={textColor} fw={500}>
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </Text>
      </div>

      {/* Step circles with progress bar */}
      <div className="relative flex items-center justify-between">
        {/* Background progress bar */}
        <div 
          className="absolute h-1 left-0 right-0 top-1/2 -translate-y-1/2 z-0"
          style={{ backgroundColor: progressBarBgColor }}
          aria-hidden="true"
        ></div>
        
        {/* Filled progress bar */}
        <div 
          className="absolute h-1 left-0 top-1/2 -translate-y-1/2 z-0 transition-all duration-300"
          style={{ 
            backgroundColor: primaryColor,
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` 
          }}
          aria-hidden="true"
        ></div>
        
        {/* Step circles */}
        <div className="relative z-10 w-full flex justify-between">
          {Array.from({ length: totalSteps }).map((_, index) => {
            // Determine the status of the step
            const isCompleted = index + 1 < currentStep;
            const isCurrent = index + 1 === currentStep;
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                  style={{ 
                    backgroundColor: isCompleted 
                      ? completedColor
                      : isCurrent 
                        ? primaryColor 
                        : incompleteBgColor,
                    boxShadow: isCurrent ? `0 0 0 4px ${primaryLightColor}` : 'none'
                  }}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : (
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 500,
                      color: isCurrent ? 'white' : isDarkMode ? theme.colors.gray[4] : theme.colors.gray[6]
                    }}>
                      {index + 1}
                    </span>
                  )}
                </div>
                {stepNames && stepNames[index] && (
                  <Text 
                    size="xs" 
                    ta="center"
                    style={{
                      marginTop: '0.5rem',
                      fontWeight: isCurrent ? 500 : 400,
                      color: isCurrent 
                        ? primaryColor 
                        : isCompleted 
                          ? isDarkMode ? theme.colors.gray[3] : theme.colors.gray[8]
                          : isDarkMode ? theme.colors.gray[5] : theme.colors.gray[5],
                      whiteSpace: 'nowrap',
                      maxWidth: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {stepNames[index]}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 