import { useEffect, useState } from 'react';

export function useItemImage(open: boolean, itemId?: number) {
    const [file, setFile] = useState<File | null>(null);
    const [remove, setRemove] = useState(false);
    useEffect(() => {
        setFile(null);
        setRemove(false);
    }, [open, itemId]);
    return {
        file,
        remove,
        change: (nextFile: File | null, nextRemove: boolean) => {
            setFile(nextFile);
            setRemove(nextRemove);
        },
    };
}
