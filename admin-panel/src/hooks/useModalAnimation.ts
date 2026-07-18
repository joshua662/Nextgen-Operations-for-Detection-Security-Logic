import { useState, useEffect } from "react";

export function useModalAnimation(isOpen: boolean, delay: number = 200) {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (isOpen) {
            setShouldRender(true);
            setIsAnimatingOut(false);
        } else if (shouldRender) {
            setIsAnimatingOut(true);
            timeout = setTimeout(() => {
                setShouldRender(false);
                setIsAnimatingOut(false);
            }, delay);
        }
        return () => clearTimeout(timeout);
    }, [isOpen, shouldRender, delay]);

    return { shouldRender, isAnimatingOut };
}
