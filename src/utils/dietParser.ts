export interface DietRecord {
    date: string;
    weight: number;
    change: string;
}

export async function getDietHistoryFromPosts(): Promise<DietRecord[]> {
    // 1. 해당 경로의 모든 마크다운 파일을 가져옴
    const matches = import.meta.glob('/src/content/posts/life/body/**/*.md', { eager: true, as: 'raw' });
    
    const records: DietRecord[] = [];

    // 2. 파일 파싱
    for (const path in matches) {
        const content = matches[path] as string;
        
        const dateRegex = /(?:^|\n)###\s+(\d{4})[-.\s년]+(\d{1,2})[-.\s월]+(\d{1,2})(?:[일\s]*)/g;
        
        while (true) {
            const match = dateRegex.exec(content);
            if (match === null) break;

            const year = match[1];
            const month = match[2].padStart(2, '0');
            const day = match[3].padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            
            const startIndex = match.index + match[0].length;
            const nextMatchIndex = content.slice(startIndex).search(/(?:^|\n)###\s+\d{4}/);
            const endIndex = nextMatchIndex === -1 ? content.length : startIndex + nextMatchIndex;
            const sectionContent = content.slice(startIndex, endIndex);

            const weightRegex = /([0-9]+(?:\.[0-9]+)?)\s*[kK][gG]/;
            const weightMatch = weightRegex.exec(sectionContent);

            if (weightMatch) {
                const weight = Number.parseFloat(weightMatch[1]);
                
                records.push({
                    date: dateStr,
                    weight: weight,
                    change: ''
                });
            }
        }
    }

    // 3. 날짜 오름차순 정렬
    records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // 4. 변화량(Change) 자동 계산
    if (records.length > 0) {
        for (let i = 0; i < records.length; i++) {
            if (i === 0) {
                records[i].change = '0.0 (시작)';
            } else {
                const curr = records[i].weight;
                const startWeight = records[0].weight;
                const totalDiff = (curr - startWeight).toFixed(1);
                
                const diffValue = Number.parseFloat(totalDiff);
                if (diffValue > 0) records[i].change = `+${totalDiff}`;
                else if (diffValue === 0) records[i].change = '0.0';
                else records[i].change = totalDiff;
            }
        }
    }

    return records;
}