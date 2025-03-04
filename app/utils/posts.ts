import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

export type PostType = {
  id: string
  title: string
  body: string
}

export const fetchPost = createServerFn({ method: 'GET' })
  .validator((d: string) => d)
  .handler(async ({ data: postId }) => {
    console.info(`Fetching post with id ${postId}...`)
    
    try {
      const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw notFound();
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const post: PostType = await response.json();
      return post;
    } catch (err: unknown) {
      console.error(err);
      throw err;
    }
  })

export const fetchPosts = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching posts...')
    await new Promise((resolve) => setTimeout(resolve, 1000))
    
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data: Array<PostType> = await response.json();
    return data.slice(0, 10);
  },
)
