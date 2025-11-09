/**
 * Social Links Block Editor Component
 */

"use client";

import React from "react";
import { useEmailBuilder } from "../EmailBuilderContext";
import type { SocialLinksBlock } from "@/lib/email-builder/types";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Github, Link2 } from "lucide-react";

interface SocialLinksBlockEditorProps {
  block: SocialLinksBlock;
  blockId: string;
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  github: Github,
};

export function SocialLinksBlockEditor({ block, blockId }: SocialLinksBlockEditorProps) {
  const style = {
    padding: `${block.data.style.padding?.top || 0}px ${block.data.style.padding?.right || 0}px ${block.data.style.padding?.bottom || 0}px ${block.data.style.padding?.left || 0}px`,
    backgroundColor: block.data.style.backgroundColor || undefined,
    textAlign: block.data.style.textAlign,
  };

  const { iconSize, spacing, alignment, iconColor, socialLinks } = block.data.props || {};

  const getIcon = (iconName: string) => {
    const IconComponent = socialIcons[iconName.toLowerCase()] || Link2;
    return IconComponent;
  };

  // Ensure socialLinks is an array
  const links = Array.isArray(socialLinks) ? socialLinks : [];

  return (
    <div style={style}>
      <div
        style={{
          display: "flex",
          justifyContent:
            alignment === "center"
              ? "center"
              : alignment === "right"
              ? "flex-end"
              : "flex-start",
          gap: `${spacing || 8}px`,
          flexWrap: "wrap",
        }}
      >
        {links.length > 0 ? (
          links.map((link, index) => {
            const IconComponent = getIcon(link.icon || "link");
            return (
              <a
                key={index}
                href={link.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: `${iconSize || 24}px`,
                  height: `${iconSize || 24}px`,
                  color: iconColor || "#6B7280",
                  textDecoration: "none",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ width: `${(iconSize || 24) * 0.6}px`, height: `${(iconSize || 24) * 0.6}px` }}>
                  <IconComponent className="w-full h-full" />
                </div>
              </a>
            );
          })
        ) : (
          <div className="text-gray-400 text-sm py-4">No social links added</div>
        )}
      </div>
    </div>
  );
}

