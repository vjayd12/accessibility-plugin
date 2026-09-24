import './IframeView.css'

const SITE_URL = 'https://prelogin-uat.icicidirect.com/'

export default function IframeView() {
  return (
    <div className="iframe-page">
      <iframe
        src={SITE_URL}
        title="ICICI Direct Prelogin UAT"
        className="iframe-embed"
      />
    </div>
  )
}
