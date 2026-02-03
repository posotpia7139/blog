export interface DietRecord {
	date: string;
	weight: number;
	change: string;
}

export async function getDietHistoryFromPosts(): Promise<DietRecord[]> {
	const matches = import.meta.glob("/src/content/posts/life/body/**/*.md", {
		eager: true,
		query: "?raw",
		import: "default",
	});
	const records: DietRecord[] = [];

	for (const path in matches) {
		// '다이어트 일지 0'은 데이터 집계에서 제외함.
		if (path.includes("diet-journal-0")) continue;

		const content = matches[path] as string;
		const dateRegex =
			/(?:^|\n)###\s+(\d{4})[-.\s](\d{1,2})[-.\s](\d{1,2})(?:[\s]*)/g;

		while (true) {
			const match = dateRegex.exec(content);
			if (match === null) break;

			const year = match[1];
			const month = match[2].padStart(2, "0");
			const day = match[3].padStart(2, "0");
			const dateStr = `${year}-${month}-${day}`;

			const startIndex = match.index + match[0].length;
			const nextMatchIndex = content
				.slice(startIndex)
				.search(/(?:^|\n)###\s+\d{4}/);
			const endIndex =
				nextMatchIndex === -1 ? content.length : startIndex + nextMatchIndex;
			const sectionContent = content.slice(startIndex, endIndex);

			const weightRegex = /([0-9]+(?:\.[0-9]+)?)\s*[kK][gG]/;
			const weightMatch = weightRegex.exec(sectionContent);

			if (weightMatch) {
				const weight = Number.parseFloat(weightMatch[1]);
				records.push({
					date: dateStr,
					weight: weight,
					change: "",
				});
			}
		}
	}

	// 날짜순 정렬
	records.sort(
		(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
	);

	if (records.length > 0) {
		// 모든 기록 중 최고 몸무게를 찾음
		const weights = records.map((r) => r.weight);
		const maxWeight = Math.max(...weights);

		for (let i = 0; i < records.length; i++) {
			const curr = records[i].weight;
			// 최고 몸무게 대비 차이 계산
			const diffFromMax = (curr - maxWeight).toFixed(1);
			const diffValue = Number.parseFloat(diffFromMax);

			if (diffValue > 0) {
				records[i].change = `+${diffFromMax}`;
			} else if (curr === maxWeight) {
				records[i].change = "0.0 (최고)";
			} else {
				records[i].change = diffFromMax; // 음수 기호(-) 포함됨
			}
		}
	}

	return records;
}
