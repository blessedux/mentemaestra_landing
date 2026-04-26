"use client";

import Script from "next/script";

type Props = { projectId: string };

/**
 * Injects the Microsoft Clarity tracking snippet.
 * Loaded after interactive to avoid blocking portal render.
 */
export default function ClarityScript({ projectId }: Props) {
  return (
    <Script
      id="ms-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window,document,"clarity","script","${projectId}");`,
      }}
    />
  );
}
