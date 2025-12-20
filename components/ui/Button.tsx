import { Text, Pressable, PressableProps } from "react-native";

interface ButtonProps extends PressableProps {
    title: string;
    variant?: "primary" | "secondary" | "danger";
}

export function Button({ title, variant = "primary", className, ...props }: ButtonProps) {
    const baseStyle = "p-4 rounded-lg items-center justify-center active:opacity-80";
    const variants = {
        primary: "bg-blue-600",
        secondary: "bg-gray-200",
        danger: "bg-red-500",
    };
    const textVariants = {
        primary: "text-white font-bold",
        secondary: "text-gray-800 font-bold",
        danger: "text-white font-bold",
    };

    return (
        <Pressable className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
            <Text className={textVariants[variant]}>{title}</Text>
        </Pressable>
    );
}
