import { cn, PageLayout, PageSection, SectionWrapper, type PageLayoutProps } from '../frame_layout'

export interface ThreeColumnsProps extends PageLayoutProps {
  sidebarWidth?: number
  minSidebarWidth?: number
  minRightPanelWidth?: number
  resizableRightPanel?: boolean
}

export class ThreeColumns extends PageLayout<ThreeColumnsProps> {
  renderContent() {
    const { className, minSidebarWidth = 300, minRightPanelWidth } = this
      .props as ThreeColumnsProps

    return (
      <div className={cn('frame-layout-row', className)}>
        <SectionWrapper
          tag="aside"
          className="frame-layout-col"
          minWidth={minSidebarWidth}
          resizable="right"
        >
          <PageSection
            name="sidebar"
            className="frame-section frame-section-sidebar"
          />
        </SectionWrapper>

        <SectionWrapper tag="main" className="frame-layout-col frame-layout-col-main">
          <PageSection name="main" className="frame-section" />
        </SectionWrapper>

        <SectionWrapper
          minWidth={minRightPanelWidth}
          tag="aside"
          resizable="left"
          className="frame-layout-col frame-layout-col-aside"
        >
          <PageSection
            name="rightPanel"
            className="frame-section frame-section-right"
          />
        </SectionWrapper>
      </div>
    )
  }
}
