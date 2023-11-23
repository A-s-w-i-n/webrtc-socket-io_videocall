// pages/index.js
"use client"

import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
// import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  

  const joinRoom = () => {
    router.push(`/room/${id || Math.random().toString(36).slice(2)}`);
    console.log();   
  };

  return (
    <>
      <Head>
        <title>WebRTC API with NextJS</title>
        <meta name='description' content='use webrtc for video call' />
        <link rel="icon" href="" />
      </Head>
      <main>
        <h1>Join Room</h1>
        <input
          type="text"
          onChange={(e) => setId(e.target.value)}
          value={id}
          className='text-black'
        />
        <button className='bg-green-300 w-32 h-10 rounded-lg' onClick={joinRoom}>
          Click to Join
        </button>
      </main>
    </>
  );
}
