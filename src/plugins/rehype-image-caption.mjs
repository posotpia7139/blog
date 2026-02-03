import { visit } from "unist-util-visit";

/**
 * Rehype plugin to wrap images in figure and add figcaption
 */
export function rehypeImageCaption() {
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName === "img" && node.properties && node.properties.alt) {
				const alt = node.properties.alt;

				// 이미 figure 안에 있는지 확인하지 않고, 단순하게 모든 이미지에 적용할 경우 중복될 수 있으므로 주의 필요.
				// 하지만 rehype 단계에서는 보통 img 태그만 넘어옴.

				// 기존 노드를 figure로 감싸기 위해 부모 노드 처리가 필요하지만,
				// visit 함수 내에서 node를 교체(replace)하는 방식을 사용함.

				// 이미지 노드 복제
				const imgNode = { ...node };

				// 캡션 노드 생성
				const captionNode = {
					type: "element",
					tagName: "figcaption",
					properties: { className: ["image-caption"] },
					children: [{ type: "text", value: alt }],
				};

				// figure 노드로 교체
				node.tagName = "figure";
				node.properties = { className: ["image-container"] };
				node.children = [imgNode, captionNode];
			}
		});
	};
}
