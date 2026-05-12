"use client";

interface RodentTypeIconProps {
    openmojiCode: string;
    label: string;
    rodentId?: string;
    size?: number;
}

export function RodentTypeIcon({
    openmojiCode,
    label,
    rodentId,
    size = 24,
}: RodentTypeIconProps) {
    // Load OpenMoji SVG from the color pack
    const svgPath = `/openmoji/color/svg/${openmojiCode}.svg`;

    // Apply filters to differentiate from base squirrel/hamster
    const getFilterStyle = () => {
        if (rodentId === "gerbil") {
            return { filter: "hue-rotate(-15deg) saturate(1.1)" };
        }
        if (rodentId === "guinea-pig") {
            return { filter: "saturate(0) brightness(0.85)" };
        }
        if (rodentId === "chipmunk") {
            return { filter: "saturate(0) brightness(0.9)" };
        }
        return {};
    };
    const filterStyle = getFilterStyle();

    return (
        <img
            src={svgPath}
            alt={label}
            title={label}
            width={size}
            height={size}
            style={{
                display: "inline-block",
                verticalAlign: "middle",
                ...filterStyle,
            }}
        />
    );
}
