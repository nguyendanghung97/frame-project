import { cn, PageLayout, PageSection, SectionWrapper, type PageLayoutProps } from '../frame-layout';

export interface TwoColumnsWithHeaderLayoutProps extends PageLayoutProps {
  sidebarWidth?: number;
  minSidebarWidth?: number;
}

export class TwoColumnsWithHeader extends PageLayout<TwoColumnsWithHeaderLayoutProps> {
  renderContent() {
    const { className, sidebarWidth, minSidebarWidth } = this.props as TwoColumnsWithHeaderLayoutProps;

    return (
      <div className={cn('flex-1 flex flex-col overflow-hidden border-t border-border', className)}>
        <SectionWrapper tag="header" className="h-20 bg-[#E6F4FE] shrink-0">
          <PageSection name="header" />
        </SectionWrapper>

        <div className="flex-1 flex overflow-y-auto">
          {/* Left Panel */}
          <SectionWrapper
            tag="aside"
            // condition={{ sidebar: true }}
            resizable="right"
            minWidth={minSidebarWidth}
            defaultWidth={sidebarWidth}
            className={cn('bg-muted/10 h-full')}
          >
            <PageSection name="sidebar" className="h-full" />
          </SectionWrapper>
          {/* Thêm min-w-0 vào wrapper cột trái và SectionWrapper của main để tránh tràn khi có DataTable/chart */}
          {/* Main Content Area */}
          <SectionWrapper tag="main" className="z-40 flex-1 flex flex-col h-fit pl-6 min-w-0 pr-2.5 overflow-y-visible">
            <PageSection name="main" className="flex flex-col min-h-screen py-4" />
          </SectionWrapper>
        </div>
      </div>
    );
  }
}
