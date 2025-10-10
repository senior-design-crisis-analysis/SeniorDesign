import { useState, useEffect } from 'react'
import CountMap from './components/CountMap'
import HelpRequestPost from './components/HelpRequestPost'
import './App.css'
import supabase from './supabase-client'

  type Row = {
    uri: string;
    author: string | null;
    disaster_type: string | null;
    severity_level: string | null;
    original_text: string | null;
    location_mentioned: string | null;
    //created_at?: string | null; // <-- add if you have a time column
  };

function App() {
  const [posts, setPosts] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('SZ-extracted_info_output_duplicate')
        .select('*');

        console.log('Supabase answer:', { data, error });
      if (error) {
        console.error(error);
        setError(error.message);
      } else {
        setPosts(data || []);
      }
    };

    fetchPosts();
  }, []);

  if (error) return <p style={{ color: 'red' }}>Supabase error: {error}</p>;
  if (!posts.length) return <p>Loading…</p>;



  return (
    <>
      {/*<CountMap />*/}
      <ul>
        {/**
         * for each post in the SZ-extracted_info_output_duplicate table, return a <HelpRequestPost /> component
         * in each <HelpRequestPost /> component, pass in movie as props
         * each time you use .map, provide a unique key for each object
         */}
        {posts.map((post) => (
        <li key={post.uri}>
          <HelpRequestPost
            data={{
              handle: post.author ?? 'Anonymous',
              category: post.disaster_type ?? 'unknown',
              severity: post.severity_level ?? 'unknown',
              text: post.original_text ?? '',
              location: post.location_mentioned ?? 'unknown',
              //time: post.created_at ?? '',
            }}
          />
        </li>
      ))}
      </ul>
    </>
  )
}

export default App
