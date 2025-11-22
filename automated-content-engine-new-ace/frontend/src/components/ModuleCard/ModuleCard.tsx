"use client";

import clsx from "clsx";
import { Star, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import {
  addModuleToFavorites,
  removeModuleFromFavorites,
} from "@/helpers/networking";

interface ModuleCardProps {
  name: string;
  coverImage: string;
  subtitle?: string;
  moduleId?: string;
  isFavorite?: boolean;
  onFavoriteChange?: (isFavorite: boolean) => void;
  showRecommendedBadge?: boolean;
}

export default function ModuleCard({
  name,
  coverImage,
  subtitle = "Chat with your favorite bot",
  moduleId,
  isFavorite = false,
  onFavoriteChange,
  showRecommendedBadge = false,
}: ModuleCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [isToggling, setIsToggling] = useState(false);

  // Sync favorite state with prop changes
  useEffect(() => {
    setFavorite(isFavorite);
  }, [isFavorite]);

  const handleStarClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!moduleId || isToggling) return;

    setIsToggling(true);
    try {
      if (favorite) {
        await removeModuleFromFavorites(moduleId);
        setFavorite(false);
        onFavoriteChange?.(false);
      } else {
        await addModuleToFavorites(moduleId);
        setFavorite(true);
        onFavoriteChange?.(true);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className={clsx(
        "w-64",
        "min-h-76",
        "bg-[rgba(255,255,255,0.06)] backdrop-blur-sm",
        "p-2 rounded-xl shadow-md overflow-hidden flex flex-col relative",
        "transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer",
        "border border-[rgba(0,255,136,0.25)] shadow-2xl",
        "hover:border-[rgba(0,255,136,0.5)] hover:shadow-[0_0_24px_rgba(0,255,136,0.3)]",
        favorite &&
          "border-[rgba(255,215,0,0.5)] shadow-[0_0_16px_rgba(255,215,0,0.2)]"
      )}
    >
      {showRecommendedBadge && (
        <div
          className={clsx(
            "absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md",
            "bg-gradient-to-r from-[#00ff88] to-[#00cc6e]",
            "text-black text-xs font-bold",
            "shadow-[0_0_12px_rgba(0,255,136,0.4)]",
            "flex items-center gap-1.5",
            "backdrop-blur-sm"
          )}
        >
          <Sparkles className="w-3 h-3" />
          <span>Start here</span>
        </div>
      )}
      {moduleId && (
        <button
          onClick={handleStarClick}
          className={clsx(
            "absolute top-3 right-3 z-10 p-1.5 rounded-full",
            "bg-black/50 backdrop-blur-sm",
            "transition-all duration-200",
            "hover:bg-black/70",
            favorite && "bg-yellow-500/20 hover:bg-yellow-500/30"
          )}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={clsx(
              "w-5 h-5 transition-all duration-200",
              favorite
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-400 hover:text-yellow-400"
            )}
          />
        </button>
      )}

      <div className="w-full flex items-center justify-center">
        <img
          src={coverImage}
          alt={name}
          className="object-contain h-full w-full rounded-xl"
        />
      </div>

      <h3 className="text-sm text-center text-white font-bold py-2 line-clamp-1 truncate">
        {name}
      </h3>
      {subtitle && (
        <p className="text-xs text-center text-muted-foreground pb-1 line-clamp-2">
          {subtitle}
        </p>
      )}
    </div>
  );
}
