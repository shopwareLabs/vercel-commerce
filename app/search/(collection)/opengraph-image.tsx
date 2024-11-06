import OpengraphImage from 'components/opengraph-image';
import { getCollection } from 'lib/shopware';

export const runtime = 'edge';

export default async function Image({ params }: { params: { collection: string } }) {
  const { collection: collectionParamName } = await params;
  const collection = await getCollection(collectionParamName);
  const title = collection?.seo?.title || collection?.title;

  return await OpengraphImage({ title });
}
