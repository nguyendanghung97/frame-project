export function DateDivider({ date }: { date: string }) {
  return (
    <div className="discussion-date_divider">
      <div className="discussion-date_divider-line" />
      <span className="discussion-date_divider-label">{date}</span>
      <div className="discussion-date_divider-line" />
    </div>
  )
}
