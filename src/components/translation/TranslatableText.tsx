"use client";

import React, { useEffect } from "react";
import { useTextTranslation, registerTextForTranslation } from "@/contexts/TranslationContext";
import { Loader2 } from "lucide-react";

interface TranslatableTextProps {
  children: string | React.ReactNode;
  className?: string;
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  enabled?: boolean;
  fallback?: string;
  showLoading?: boolean;
  preserveFormatting?: boolean;
}

export function TranslatableText({
  children,
  className = "",
  as: Component = "span",
  enabled = true,
  fallback,
  showLoading = false,
  preserveFormatting = false,
}: TranslatableTextProps) {
  // Handle React nodes (JSX elements) - don't translate
  if (typeof children !== "string") {
    return <Component className={className}>{children}</Component>;
  }

  // Register for batch translation immediately
  useEffect(() => {
    if (children && enabled) registerTextForTranslation(children);
  }, [children, enabled]);

  const { translatedText, isTranslating } = useTextTranslation(children, {
    enabled,
  });

  // If translation is disabled or original text is empty, return as-is
  if (!enabled || !children || children.trim().length === 0) {
    return (
      <Component className={className}>{children || fallback}</Component>
    );
  }

  // Show loading indicator if enabled and currently translating
  if (showLoading && isTranslating) {
    return (
      <Component className={`${className} inline-flex items-center space-x-2`}>
        <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
        <span className="text-gray-400">{children}</span>
      </Component>
    );
  }

  // Preserve line breaks and basic formatting if requested
  if (preserveFormatting && translatedText.includes("\n")) {
    return (
      <Component className={className}>
        {translatedText.split("\n").map((line, index, arr) => (
          <React.Fragment key={index}>
            {line}
            {index < arr.length - 1 && <br />}
          </React.Fragment>
        ))}
      </Component>
    );
  }

  return <Component className={className}>{translatedText}</Component>;
}

// Specialized components for common use cases
export function TranslatableHeading({
  level = 1,
  children,
  className = "",
  ...props
}: TranslatableTextProps & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const headingTag = `h${level}` as
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6";

  return (
    <TranslatableText as={headingTag} className={className} {...props}>
      {children}
    </TranslatableText>
  );
}

export function TranslatableParagraph({
  children,
  className = "",
  ...props
}: TranslatableTextProps) {
  return (
    <TranslatableText
      as="p"
      className={className}
      preserveFormatting={true}
      {...props}
    >
      {children}
    </TranslatableText>
  );
}

export function TranslatableButton({
  children,
  onClick,
  className = "",
  disabled = false,
  ...props
}: TranslatableTextProps & {
  onClick?: () => void;
  disabled?: boolean;
}) {
  // Handle non-string children
  if (typeof children !== "string") {
    return (
      <button onClick={onClick} disabled={disabled} className={className}>
        {children}
      </button>
    );
  }

  const { translatedText, isTranslating } = useTextTranslation(children);

  return (
    <button
      onClick={onClick}
      disabled={disabled || isTranslating}
      className={`${className} ${isTranslating ? "opacity-70 cursor-wait" : ""}`}
    >
      {isTranslating ? (
        <span className="inline-flex items-center space-x-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{children}</span>
        </span>
      ) : (
        translatedText
      )}
    </button>
  );
}

// Higher-order component for translating entire components
export function withTranslation<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  textFields: string[] = []
) {
  return function TranslatedComponent(props: T) {
    return <WrappedComponent {...props} />;
  };
}

// Hook for translating object properties
export function useObjectTranslation<T extends Record<string, any>>(
  obj: T,
  fieldsToTranslate: (keyof T)[]
): T & { isTranslating: boolean } {
  const [translatedObj, setTranslatedObj] = React.useState(obj);
  const [isTranslating, setIsTranslating] = React.useState(false);

  React.useEffect(() => {
    setTranslatedObj(obj);
  }, [obj]);

  return { ...translatedObj, isTranslating };
}