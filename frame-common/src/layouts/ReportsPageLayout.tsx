import { cn, PageLayout, PageSection, SectionWrapper, type PageLayoutProps } from '../frame-layout';

export interface ReportsPageLayoutProps extends PageLayoutProps {
  showHeader?: boolean;
  minRightPanelWidth?: number;
  showFilterPanel?: boolean;
}

export class ReportsPageLayout extends PageLayout<ReportsPageLayoutProps> {
  renderContent() {
    const { className, minRightPanelWidth, showHeader = false, showFilterPanel = true } = this.props as ReportsPageLayoutProps;

    return (
      <div className={cn('h-full flex overflow-y-auto w-full bg-primary-dark', className)}>
        {/* Thêm min-w-0 vào wrapper cột trái và SectionWrapper của main để tránh tràn khi có DataTable/chart */}
        {/* Main Content Area */}
        <SectionWrapper tag="main" className="min-w-0 flex-1 h-full flex flex-col">
          {showHeader && <PageSection name="mainHeader" className="mb-2.5 h-9 border border-transparent" />}
          <PageSection name="main" className="flex-1 overflow-hidden border-x border-border rounded-tl-xl bg-white" />
        </SectionWrapper>

        {/* Right Panel */}
        {showFilterPanel && (
          <SectionWrapper tag="aside" condition={{ filterPanel: true }} resizable="left" minWidth={minRightPanelWidth} className={cn('h-full flex flex-col')}>
            <PageSection name="filterPanel" className="bg-muted flex-1 overflow-hidden" />
          </SectionWrapper>
        )}
      </div>
    );
  }
}
