import { cn, PageLayout, PageSection, SectionWrapper, type PageLayoutProps } from '../frame_layout';

export interface TwoColumnsWithSidebarLayoutProps extends PageLayoutProps {
  sidebarWidth?: number;
  minSidebarWidth?: number;
}

export class TwoColumnsWithSidebar extends PageLayout<TwoColumnsWithSidebarLayoutProps> {
  renderContent() {
    const { className, sidebarWidth, minSidebarWidth } = this.props as TwoColumnsWithSidebarLayoutProps;

    return (
      <div className={cn('flex-1 flex overflow-y-auto border-t border-border', className)}>
        {/* Left Panel */}
        <SectionWrapper
          tag="aside"
          condition={{ sidebar: true }}
          resizable="right"
          minWidth={minSidebarWidth}
          defaultWidth={sidebarWidth}
          className={cn('bg-muted/10 h-full')}
        >
          <PageSection name="sidebar" className="h-full" />
        </SectionWrapper>
        {/* Thêm min-w-0 vào wrapper cột trái và SectionWrapper của main để tránh tràn khi có DataTable/chart */}
        {/* Main Content Area */}
        <SectionWrapper tag="main" className="z-40 flex-1 flex flex-col h-full min-w-0">
          <PageSection name="main" className="h-full" />
        </SectionWrapper>
      </div>
    );
  }
}
