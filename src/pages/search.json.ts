import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('posts');
  
  const searchData = posts.map(post => {
    // 1. 명시적인 category가 있으면 사용
    let category = post.data.category;
    
    // 2. category가 없을 경우 폴더 구조를 분석하여 지능적으로 추출
    if (!category) {
        // 확장자 제거 (예: 'life/body/diet-log-0001/index.md' -> 'life/body/diet-log-0001/index')
        const cleanId = post.id.replace(/\.[^/.]+$/, "");
        let pathParts = cleanId.split('/');
        
        // 마지막 요소가 'index'이면 제거
        if (pathParts.length > 0 && pathParts[pathParts.length - 1] === 'index') {
            pathParts.pop();
        }
        
        // 마지막 요소가 포스트의 slug와 같다면(폴더형 포스트) 제거
        if (pathParts.length > 0 && pathParts[pathParts.length - 1] === post.slug) {
            pathParts.pop();
        }
        
        category = pathParts.join('/');
    }

    return {
      title: post.data.title,
      description: post.data.description || '',
      category: category || 'Uncategorized',
      tags: post.data.tags || [],
      url: `/posts/${post.slug}/`,
      content: post.body.substring(0, 500).replace(/[#`*]/g, '') 
    };
  });

  return new Response(JSON.stringify(searchData), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
