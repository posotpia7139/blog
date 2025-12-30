import { visit } from "unist-util-visit";

export function rehypeHeaderNumbering() {
	return (tree) => {
		const counters = { h2: 0, h3: 0, h4: 0 };

		visit(tree, "element", (node, index, parent) => {
			const tagName = node.tagName;

			// [수정] 각주 섹션 헤더 처리 (더 유연한 감지)
			const isFootnoteLabel =
				node.properties?.id?.includes("footnote") ||
				node.properties?.ariaLabel?.includes("footnote");

			// 텍스트 내용 추출 함수
			const getHeaderText = (n) => {
				if (n.type === "text") return n.value;
				if (n.children) return n.children.map(getHeaderText).join("");
				return "";
			};

			const headerText = getHeaderText(node).toLowerCase().trim();
			const isFootnoteText =
				headerText === "footnotes" || headerText === "각주";

			if (tagName === "h2" && (isFootnoteLabel || isFootnoteText)) {
				// 1. HR 요소 생성
				const hr = {
					type: "element",
					tagName: "hr",
					properties: { className: ["footnote-sep"] },
					children: [],
				};

				// 2. 작은 캡션 요소 생성
				const label = {
					type: "element",
					tagName: "div",
					properties: { className: ["footnote-title"] },
					children: [{ type: "text", value: "Footnotes" }],
				};

				// 기존 H2를 [HR, Label]로 교체
				parent.children.splice(index, 1, hr, label);
				return;
			}

			// H1은 무시, H2, H3, H4만 처리
			if (!["h2", "h3", "h4"].includes(tagName)) return;

			let numberString = "";

			if (tagName === "h2") {
				counters.h2++;
				counters.h3 = 0;
				counters.h4 = 0;
				numberString = `${counters.h2}.`;
			} else if (tagName === "h3") {
				counters.h3++;
				counters.h4 = 0;
				numberString = `${counters.h2}.${counters.h3}.`;
			} else if (tagName === "h4") {
				counters.h4++;
				numberString = `${counters.h2}.${counters.h3}.${counters.h4}.`;
			}

			if (numberString) {
				// 번호를 감싸는 span 요소 생성
				const numberSpan = {
					type: "element",
					tagName: "span",
					properties: { className: ["section-num"] },
					children: [{ type: "text", value: `${numberString} ` }],
				};

				// 기존 자식 요소들 앞에 span 추가
				node.children.unshift(numberSpan);
			}
		});
	};
}
