import { visit } from "unist-util-visit";

export function remarkMidlineEllipsis() {
	return (tree) => {
		visit(tree, "text", (node) => {
			// 1. 이미 존재하는 아래쪽 줄임표(…)를 가운데 줄임표(⋯)로 변환
			// 예: … -> ⋯, …… -> ⋯⋯
			if (node.value.includes("…")) {
				node.value = node.value.replace(/…/g, "⋯");
			}

			// 2. 마침표가 3개 이상 연속된 패턴(...)을 찾아 가운데 줄임표(⋯)로 변환
			// 예: ... -> ⋯, ...... -> ⋯⋯
			if (node.value.includes("...")) {
				node.value = node.value.replace(/\.{3,}/g, (match) => {
					const count = Math.floor(match.length / 3);
					const remainder = match.length % 3;
					return "⋯".repeat(count) + ".".repeat(remainder);
				});
			}
		});
	};
}
