import { cn, PageLayout, PageSection, SectionWrapper, type PageLayoutProps } from '../frame-layout'

export interface TwoColumnsWithRightPanelLayoutProps extends PageLayoutProps {
  minRightPanelWidth?: number
  resizableRightPanel?: boolean
}

export class TwoColumnsWithRightPanel extends PageLayout<TwoColumnsWithRightPanelLayoutProps> {
  renderContent() {
    const { className, minRightPanelWidth } = this
      .props as TwoColumnsWithRightPanelLayoutProps

    return (
      <div className={cn('frame-layout-row', className)}>
        <SectionWrapper tag="main" className="frame-layout-col frame-layout-col--main">
          <PageSection name="main" className="frame-section" />
        </SectionWrapper>

        <SectionWrapper
          minWidth={minRightPanelWidth}
          tag="aside"
          resizable="left"
          className="frame-layout-col frame-layout-col--aside"
        >
          <PageSection name="rightPanel" className="frame-section frame-section--right" />
        </SectionWrapper>
      </div>
    )
  }
}
