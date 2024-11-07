import Footer from 'components/layout/footer';
import ChildrenWrapper from './children-wrapper';

// @ToDo: We could use dynamic Layout per page, see https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts#with-typescript
export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-8 px-4 pb-4 text-black md:flex-row dark:text-white">
        <div className="order-last min-h-screen w-full md:order-none">
          <ChildrenWrapper>{children}</ChildrenWrapper>
        </div>
      </div>
      <Footer />
    </>
  );
}
