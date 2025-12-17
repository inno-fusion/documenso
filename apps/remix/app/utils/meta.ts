import { NEXT_PUBLIC_WEBAPP_URL } from '@documenso/lib/constants/app';

export const appMetaTags = (title?: string) => {
  const description =
    '0xDocHub, Digital Document Hub for 0xMetaLabs.';

  return [
    {
      title: title ? `${title} - 0xDocHub` : '0xMetaLabs',
    },
    {
      name: 'description',
      content: description,
    },
    {
      name: 'keywords',
      content:
        '0xMetaLabs, open source, DocuSign alternative, document signing, open signing infrastructure, open-source community, fast signing, beautiful signing, smart templates',
    },
    {
      name: 'author',
      content: '0xMetaLabs, Inc.',
    },
    {
      name: 'robots',
      content: 'index, follow',
    },
    {
      property: 'og:title',
      content: '0xMetaLabs - The Open Source DocuSign Alternative',
    },
    {
      property: 'og:description',
      content: description,
    },
    {
      property: 'og:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
    {
      property: 'og:type',
      content: 'website',
    },
    {
      name: 'twitter:card',
      content: 'summary_large_image',
    },
    {
      name: 'twitter:site',
      content: '0xmetalabs',
    },
    {
      name: 'twitter:description',
      content: description,
    },
    {
      name: 'twitter:image',
      content: `${NEXT_PUBLIC_WEBAPP_URL()}/opengraph-image.jpg`,
    },
  ];
};
