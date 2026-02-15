import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileDown,
  Loader2,
  Database,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

const PYTHON_API = "http://127.0.0.1:8000";

export default function ImportExportPage() {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [exportType, setExportType] = useState<'books' | 'compliance'>('books');
  const [selectedDept, setSelectedDept] = useState<string>("CS");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- HELPER: Trigger Browser Download ---
  const triggerSingleDownload = async (endpoint: string, filename: string) => {
    const response = await fetch(`${PYTHON_API}${endpoint}`);
    if (!response.ok) throw new Error(`Failed to generate ${filename}`);
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // --- CORE: Handle Imports ---
  const handleActualImport = async (file: File, endpoint: string) => {
    setIsImporting(true);
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
      setIsImporting(false);
    }
  };

  // --- CORE: Handle Exports (Standard vs Advanced) ---
  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (exportType === 'compliance') {
        // Red/Yellow Summary Table
        await triggerSingleDownload("/export/summary", "Full_Library_Summary_2026.xlsx");
        toast.success("Curriculum Summary downloaded!");
      } else {
        // Detailed Holdings (Gray/Blue)
        if (showAdvanced) {
          // Advanced Mode: Just the one they picked
          await triggerSingleDownload(`/export/detailed?dept=${selectedDept}`, `Detailed_Holdings_${selectedDept}.xlsx`);
          toast.success(`Detailed report for ${selectedDept} downloaded!`);
        } else {
          // Standard Mode: Download ALL 3 at once (Lead's requirement)
          toast.info("Generating reports for CS, IT, and IS...");
          const depts = ["CS", "IT", "IS"];
          await Promise.all(depts.map(dept => 
            triggerSingleDownload(`/export/detailed?dept=${dept}`, `Detailed_Holdings_${dept}.xlsx`)
          ));
          toast.success("All 3 Department Holdings downloaded!");
        }
      }
      setShowExportPreview(false);
    } catch (error: any) {
      toast.error(`Export Failed: Ensure the Python server is running.`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout title="Data Operations" subtitle="Manage curriculum templates and export professional library reports">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* IMPORT SECTION */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl shadow-card p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Course Templates</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 italic">Update curriculum codes via the authoritative Excel file.</p>
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={(e) => e.target.files?.[0] && handleActualImport(e.target.files[0], '/import/templates')}
              disabled={isImporting || isExporting}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
          </div>

          <div className="bg-card rounded-xl shadow-card p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-success" />
              <h3 className="font-semibold text-lg">Library Acquisitions</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 italic">Import new books into the masterlist via CSV.</p>
            <input 
              type="file" 
              accept=".csv" 
              onChange={(e) => e.target.files?.[0] && handleActualImport(e.target.files[0], '/import/acquisitions')}
              disabled={isImporting || isExporting}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-success file:text-white hover:file:bg-success/90"
            />
          </div>
        </div>

        {/* EXPORT SECTION */}
        <div className="bg-card rounded-xl shadow-card p-6 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-lg">Export Center</h3>
          </div>
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-between h-16" 
              onClick={() => { setExportType('books'); setShowExportPreview(true); }}
            >
              <div className="text-left">
                <p className="font-medium text-blue-600">Detailed Holdings Report</p>
                <p className="text-xs text-muted-foreground">Gray/Blue Course-Book lists (exp.py)</p>
              </div>
              <FileDown className="w-5 h-5" />
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-between h-16" 
              onClick={() => { setExportType('compliance'); setShowExportPreview(true); }}
            >
              <div className="text-left">
                <p className="font-medium text-red-600">Curriculum Summary 2026</p>
                <p className="text-xs text-muted-foreground">Red/Yellow Compliance (testexport.py)</p>
              </div>
              <FileSpreadsheet className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* EXPORT DIALOG */}
      <Dialog open={showExportPreview} onOpenChange={setShowExportPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {exportType === 'books' 
                ? "Standard: Generates separate holdings files for CS, IT, and IS simultaneously." 
                : "Standard: Generates a single 5-year recency summary for all curriculums."}
            </p>

            {exportType === 'books' && (
              <div className="pt-2 border-t">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline mb-3"
                >
                  {showAdvanced ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                  {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
                </button>

                {showAdvanced && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-sm font-medium">Download specific department only:</label>
                    <select 
                      value={selectedDept} 
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full p-2 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="CS">Computer Science (CS)</option>
                      <option value="IT">Information Technology (IT)</option>
                      <option value="IS">Information Systems (IS)</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowExportPreview(false)}>Cancel</Button>
            <Button 
              onClick={() => handleDownload()} 
              className="gradient-primary text-white"
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Generate Reports
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}