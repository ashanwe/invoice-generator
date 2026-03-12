import { PDFDownloadLink } from '@react-pdf/renderer'
import { InvoicePDF } from '../templates/InvoicePDF'

// Inside your component's JSX:
<PDFDownloadLink
  document={<InvoicePDF invoice={invoice} />}
  fileName={`${invoice.invoiceNumber}.pdf`}
>
  {({ loading }) =>
    loading
      ? 'Preparing PDF...'
      : <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">
          Download PDF
        </button>
  }
</PDFDownloadLink>