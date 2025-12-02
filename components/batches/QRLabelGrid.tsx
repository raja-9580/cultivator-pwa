'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Baglet {
    baglet_id: string;
}

interface QRLabelGridProps {
    batchId: string;
}

export default function QRLabelGrid({ batchId }: QRLabelGridProps) {
    const [baglets, setBaglets] = useState<Baglet[]>([]);
    const [loading, setLoading] = useState(true);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const qrGridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchBaglets();
    }, [batchId]);

    async function fetchBaglets() {
        try {
            const res = await fetch(`/api/baglets?batch_id=${batchId}`);
            const data = await res.json();
            if (data.baglets) {
                setBaglets(data.baglets);
            }
        } catch (error) {
            console.error('Failed to fetch baglets:', error);
        } finally {
            setLoading(false);
        }
    }

    async function downloadPDF() {
        if (!qrGridRef.current) return;

        setGeneratingPDF(true);

        try {
            // Wait a bit for QR codes to render
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(qrGridRef.current, {
                scale: 2,
                backgroundColor: '#1a1a1a',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            // Add additional pages if content overflows
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            pdf.save(`${batchId}_QR_Labels.pdf`);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF');
        } finally {
            setGeneratingPDF(false);
        }
    }

    if (loading) {
        return (
            <Card>
                <p className="text-gray-400 text-center py-8">Loading baglets...</p>
            </Card>
        );
    }

    if (baglets.length === 0) {
        return (
            <Card>
                <p className="text-gray-400 text-center py-8">No baglets found for this batch.</p>
            </Card>
        );
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-accent-leaf">QR Code Labels</h2>
                <Button
                    variant="primary"
                    onClick={downloadPDF}
                    disabled={generatingPDF}
                >
                    {generatingPDF ? '📄 Generating...' : '📄 Download PDF'}
                </Button>
            </div>

            <div
                ref={qrGridRef}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
                {baglets.map((baglet) => (
                    <div
                        key={baglet.baglet_id}
                        className="flex flex-col items-center p-3 bg-white rounded border border-gray-300"
                    >
                        <QRCodeCanvas
                            value={baglet.baglet_id}
                            size={120}
                            level="M"
                            includeMargin={true}
                        />
                        <p className="text-xs text-gray-900 mt-2 text-center font-mono break-all">
                            {baglet.baglet_id}
                        </p>
                    </div>
                ))}
            </div>

            <p className="text-gray-400 text-sm mt-4">
                Total: {baglets.length} baglet{baglets.length !== 1 ? 's' : ''}
            </p>
        </Card>
    );
}
