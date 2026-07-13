import { theme } from "antd";
import type React from "react";

interface EntityAvatarProps {
    icon?: React.ReactNode;
    text?: string;
    imageUrl?: string;
    active?: boolean;
    size?: number;
    fontSize?: number;
    alt?: string;
}

export const EntityAvatar: React.FC<EntityAvatarProps> = ({
    icon,
    text,
    imageUrl,
    active = false,
    size = 32,
    fontSize = 14,
    alt = "Avatar",
}) => {
    const { token } = theme.useToken();

    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: 8,
                background: active ? token.colorPrimary : token.colorFillSecondary,
                color: active ? token.colorTextLightSolid : token.colorTextSecondary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: fontSize,
                fontWeight: text ? 700 : "normal",
                flexShrink: 0,
                overflow: "hidden",
                transition: "all 0.2s ease",
            }}
        >
            {imageUrl && imageUrl.trim() !== "" ? (
                <img
                    src={imageUrl}
                    alt={alt}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            ) : icon ? (
                icon
            ) : (
                text?.charAt(0)?.toUpperCase() || "?"
            )}
        </div>
    );
};
