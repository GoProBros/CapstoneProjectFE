import { useState, useEffect, useCallback } from 'react';
import analysisReportService from '@/services/reports/analysisReportService';
import { fileService } from '@/services/files/fileService';
import type { AnalysisReport, AnalysisReportSource, AnalysisReportCategory } from '@/types/analysisReport';
import { FileCategory } from '@/types/file';

const PAGE_SIZE = 10;

export function useAnalysisReport() {
    const [reports, setReports] = useState<AnalysisReport[]>([]);
    const [allSources, setAllSources] = useState<AnalysisReportSource[]>([]);
    const [allCategories, setAllCategories] = useState<AnalysisReportCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [pageIndex, setPageIndex] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Filters
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
    const [selectedSource, setSelectedSource] = useState<AnalysisReportSource | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<AnalysisReportCategory | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
    const [loadingPdf, setLoadingPdf] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [isPdfFullscreen, setIsPdfFullscreen] = useState(false);

    const fetchPage = useCallback(async (page: number, append: boolean, term = '', source = '', category = '') => {
        if (!append) setLoading(true);
        else setLoadingMore(true);
        try {
            const result = await analysisReportService.getReports({
                pageIndex: page,
                pageSize: PAGE_SIZE,
                searchTerm: term || undefined,
                sourceId: source || undefined,
                categoryId: category || undefined,
            });
            const items = result.items ?? [];
            setReports(prev => append ? [...prev, ...items] : items);
            setHasMore(result.hasNextPage ?? false);
            setPageIndex(page);
        } catch (err) {
            console.error('[useAnalysisReport] Failed to fetch reports:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    // Re-fetch from page 1 whenever filters change
    useEffect(() => {
        fetchPage(1, false, searchTerm, sourceFilter, categoryFilter);
    }, [fetchPage, searchTerm, sourceFilter, categoryFilter]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => setSearchTerm(searchInput), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch sources & categories for lookup
    useEffect(() => {
        analysisReportService.getSources({ pageIndex: 1, pageSize: 100 })
            .then(res => setAllSources(res.items ?? []))
            .catch(err => console.error('[useAnalysisReport] Failed to load sources:', err));
        analysisReportService.getCategories({ pageIndex: 1, pageSize: 100 })
            .then(res => setAllCategories(res.items ?? []))
            .catch(err => console.error('[useAnalysisReport] Failed to load categories:', err));
    }, []);

    // Clean up blob URL on unmount
    useEffect(() => {
        return () => {
            if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close fullscreen on Escape key
    useEffect(() => {
        if (!isPdfFullscreen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsPdfFullscreen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isPdfFullscreen]);

    const handleSelectReport = async (report: AnalysisReport) => {
        if (pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
            setPdfBlobUrl(null);
        }
        setSelectedReport(null);
        setSelectedSource(null);
        setLoadingDetail(true);
        try {
            const detail = await analysisReportService.getReportById(report.id);
            setSelectedReport(detail);
            setSelectedSource(allSources.find(s => s.code === detail.sourceId) ?? null);
            setSelectedCategory(allCategories.find(c => c.code === detail.categoryId) ?? null);
            if (detail.fileSize && detail.fileSize > 0) {
                setLoadingPdf(true);
                try {
                    const blob = await fileService.downloadFile({
                        category: FileCategory.AnalysisReport,
                        entityId: detail.id,
                    });
                    setPdfBlobUrl(URL.createObjectURL(blob));
                } catch (err) {
                    console.error('[useAnalysisReport] Failed to load PDF:', err);
                } finally {
                    setLoadingPdf(false);
                }
            }
        } catch (err) {
            console.error('[useAnalysisReport] Failed to fetch report detail:', err);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleBack = () => {
        if (pdfBlobUrl) {
            URL.revokeObjectURL(pdfBlobUrl);
            setPdfBlobUrl(null);
        }
        setSelectedReport(null);
        setSelectedSource(null);
        setSelectedCategory(null);
        setIsPdfFullscreen(false);
    };

    const handleDownload = async (report: AnalysisReport) => {
        setDownloading(true);
        try {
            await fileService.downloadFileToDevice(
                { category: FileCategory.AnalysisReport, entityId: report.id },
                report.originalFileName ?? 'report',
            );
        } catch (err) {
            console.error('[useAnalysisReport] Failed to download file:', err);
        } finally {
            setDownloading(false);
        }
    };

    return {
        // List state
        reports,
        allSources,
        allCategories,
        loading,
        loadingMore,
        pageIndex,
        hasMore,
        // Filters
        searchInput,
        setSearchInput,
        searchTerm,
        sourceFilter,
        setSourceFilter,
        categoryFilter,
        setCategoryFilter,
        // Detail state
        selectedReport,
        selectedSource,
        selectedCategory,
        loadingDetail,
        pdfBlobUrl,
        loadingPdf,
        downloading,
        isPdfFullscreen,
        setIsPdfFullscreen,
        // Actions
        fetchPage,
        handleSelectReport,
        handleBack,
        handleDownload,
    };
}
