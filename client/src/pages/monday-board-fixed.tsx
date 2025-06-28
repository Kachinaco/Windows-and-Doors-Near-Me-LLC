// This is a clean version to reference proper JSX structure for folder section alignment

const FolderSection = ({ folder, folderSubItems, columns, subItemColumns, columnWidths, expandedFolders }) => {
  return (
    <>
      {/* Folder Header Row - aligns with main project columns */}
      <div className="flex bg-gradient-to-r from-blue-950/20 to-slate-900/20 border-b border-blue-500/20">
        {/* Checkbox column */}
        <div className="w-12 px-2 py-3 border-r border-blue-500/20 flex items-center justify-center">
          <ChevronRight className={`w-4 h-4 text-blue-400 transition-transform ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`} />
        </div>
        
        {/* Folder name column - aligns with first main column */}
        <div 
          className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 flex items-center gap-2"
          style={{ 
            width: columnWidths['name'] || 240,
            minWidth: '180px',
            maxWidth: 'none'
          }}
        >
          <Folder className="w-4 h-4 text-blue-400" />
          <span className="text-blue-200 text-sm font-semibold">{folder.name}</span>
        </div>
        
        {/* Main header columns - align with project columns */}
        {columns.slice(1).map((column) => (
          <div 
            key={`folder-header-${folder.id}-${column.id}`}
            className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 flex items-center justify-center"
            style={{ 
              width: columnWidths[column.id] || 140,
              minWidth: '100px',
              maxWidth: 'none'
            }}
          />
        ))}
        
        {/* Actions column */}
        <div className="w-12 px-2 py-3 flex items-center justify-center">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-blue-500/50 bg-blue-900/30 text-blue-400 focus:ring-blue-400 focus:ring-1"
          />
        </div>
      </div>

      {/* Sub-item column headers - only show when folder is expanded */}
      {expandedFolders.has(folder.id) && (
        <div className="flex bg-gradient-to-r from-blue-950/10 to-slate-950/5 border-b border-blue-500/15">
          {/* Checkbox column alignment */}
          <div className="w-12 border-r border-blue-500/20"></div>
          
          {/* Sub-item column headers with exact same alignment as main columns */}
          {subItemColumns.map((column, index) => (
            <div 
              key={`folder-subheader-${folder.id}-${column.id}`}
              className="px-4 py-2 border-r border-blue-500/20 flex-shrink-0 flex items-center gap-2 relative group"
              style={{ 
                width: columnWidths[column.id] || (index === 0 ? 240 : 140),
                minWidth: index === 0 ? '180px' : '100px',
                maxWidth: 'none'
              }}
            >
              <div className="text-blue-400/80">{getColumnIcon(column.type)}</div>
              <span className="font-semibold text-sm text-blue-200">{column.name}</span>
            </div>
          ))}
          
          {/* Actions column alignment */}
          <div className="w-12"></div>
        </div>
      )}

      {/* Sub-items - each sub-item has columns pre-loaded but blank */}
      {expandedFolders.has(folder.id) && folderSubItems.map((subItem) => (
        <div key={`sub-${subItem.id}`} className="flex hover:bg-blue-500/8 transition-all bg-gradient-to-r from-blue-950/15 to-slate-900/10 border-b border-blue-500/10">
          {/* Sub-item checkbox - aligned with main items */}
          <div className="w-12 px-2 py-3 border-r border-blue-500/20 flex items-center justify-center">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-blue-500/50 bg-blue-900/30 text-blue-400 focus:ring-blue-400 focus:ring-1"
            />
          </div>
          
          {/* Sub-item columns - each column with exact same width as headers */}
          {subItemColumns.map((column, colIndex) => (
            <div 
              key={`sub-col-${subItem.id}-${column.id}`}
              className="px-4 py-3 border-r border-blue-500/20 flex-shrink-0 flex items-center"
              style={{ 
                width: columnWidths[column.id] || (colIndex === 0 ? 240 : 140),
                minWidth: colIndex === 0 ? '180px' : '100px',
                maxWidth: 'none'
              }}
            >
              <span 
                className="text-blue-200 text-sm cursor-pointer hover:bg-blue-500/20 px-2 py-1 rounded w-full"
                onClick={() => {
                  // Edit functionality - all columns are pre-loaded but blank
                }}
              >
                {subItem[column.id] || 'Click to edit'}
              </span>
            </div>
          ))}
          
          {/* Actions column aligned with main items */}
          <div className="w-12 px-2 py-3 flex items-center justify-center">
            {/* Action buttons */}
          </div>
        </div>
      ))}
    </>
  );
};