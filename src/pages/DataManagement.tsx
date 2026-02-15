import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Upload, Download, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const PYTHON_API = "http://127.0.0.1:8000";

export default function DataManagementPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleFileUpload = async (endpoint: string, file: File) => {
    setLoading(endpoint);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${PYTHON_API}${endpoint}`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (response.ok) toast.success(result.message);
      else throw new Error(result.message);
    } catch (error: any) {
      toast.error(`Import Failed: ${error.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleExport = async (endpoint: string, filename: string) => {
    setLoading(endpoint);
    try {
      const response = await fetch(`${PYTHON_API}${endpoint}`);
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      toast.success("Download started");
    } catch (error) {
      toast.error("Could not generate report");
    } finally {
      setLoading(null);
    }
  };

  return (
    <MainLayout title="Data Management" subtitle="Sync curriculum templates and export library reports">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
        
        {/* IMPORT SECTION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Import Data
            </CardTitle>
            <CardDescription>Update the system with new course or book data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Course Templates (Excel)</label>
              <input 
                type="file" 
                accept=".xlsx" 
                onChange={(e) => e.target.files?.[0] && handleFileUpload('/import/templates', e.target.files[0])}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
            </div>
            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium">Acquisitions (CSV)</label>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => e.target.files?.[0] && handleFileUpload('/import/acquisitions', e.target.files[0])}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-success file:text-white hover:file:bg-success/90"
              />
            </div>
          </CardContent>
        </Card>

        {/* EXPORT SECTION */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" /> Generate Reports
            </CardTitle>
            <CardDescription>Download formatted compliance documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-between" 
              onClick={() => handleExport('/export/summary', 'Curriculum_Summary_2026.xlsx')}
              disabled={!!loading}
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> Curriculum Summary
              </div>
              {loading === '/export/summary' ? <Loader2 className="animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>

            <div className="grid grid-cols-3 gap-2">
              {['CS', 'IT', 'IS'].map((dept) => (
                <Button 
                  key={dept} 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleExport(`/export/detailed?dept=${dept}`, `Holdings_${dept}.xlsx`)}
                  disabled={!!loading}
                >
                  {dept} Report
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}