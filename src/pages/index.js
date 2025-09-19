import Head from 'next/head';
import Desktop from '@/components/Desktop';

export default function Home() {
  return (
    <>
      <Head>
        <title>Web OS</title>
        <meta name="description" content="A Web OS for group collaboration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Desktop />
    </>
  );
}