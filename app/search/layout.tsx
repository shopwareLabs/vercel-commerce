import Footer from 'components/layout/footer';

// @ToDo: We could use dynamic Layout per page, see https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts#with-typescript
export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Footer />
    </>
  );
}
