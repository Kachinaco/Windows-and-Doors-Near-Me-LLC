          <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
            <div className="flex">
              {/* Selection checkbox header */}
              <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center sticky left-0 bg-white z-30">
                <input
                  type="checkbox"
                  checked={selectedItems.size > 0 && selectedItems.size === boardItems.length}
                  onChange={selectedItems.size === boardItems.length ? handleSelectNone : handleSelectAll}
                  className="w-4 h-4 rounded border-gray-400 bg-white text-blue-500 focus:ring-blue-500 focus:ring-1"
                />
              </div>
              {columns.map((column, index) => (
                <div 
                  key={column.id} 
                  className={`px-3 py-3 border-r border-gray-200 relative group flex-shrink-0 bg-white ${
                    index === 0 ? 'sticky left-12 z-20' : 'z-10'
                  }`}
                  style={{ 
                    width: columnWidths[column.id] || (index === 0 ? 120 : 120),
                    minWidth: index === 0 ? '80px' : '90px',
                    maxWidth: 'none'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    {getColumnIcon(column.type)}
                    <span className="font-medium text-sm text-gray-300">{column.name}</span>
                  </div>
                  {index < columns.length - 1 && (
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center bg-transparent hover:bg-blue-500/20 transition-all group touch-none"
                      onPointerDown={(e) => handlePointerDown(column.id, e)}
                      title="Resize"
                      style={{ touchAction: 'none' }}
                    >
                      <div className="w-0.5 h-4 bg-gray-600 hover:bg-blue-400 rounded-full transition-all duration-200 group-hover:h-5 group-hover:bg-blue-400"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>


          </div>

          {/* Groups and Items */}
          {boardGroups.map((group) => (
            <div key={group.name} className="border-b border-gray-200 last:border-b-0">
              {/* Enhanced Group Header with proper column structure */}
              <div className={`flex border-b border-gray-200 hover:bg-gray-50 transition-all ${
                group.name === 'New Leads' ? 'bg-cyan-50' :
                group.name === 'Need Attention' ? 'bg-yellow-50' :
                group.name === 'Sent Estimate' ? 'bg-purple-50' :
                group.name === 'Signed' ? 'bg-emerald-50' :
                group.name === 'In Progress' ? 'bg-blue-50' :
                group.name === 'Complete' ? 'bg-green-50' :
                'bg-gray-50'
              }`}>
                {/* Group Selection Checkbox */}
                <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center sticky left-0 bg-white z-30">
                  <input
                    type="checkbox"
                    checked={isGroupSelected(group.name)}
                    ref={el => {
                      if (el) {
                        el.indeterminate = isGroupPartiallySelected(group.name);
                      }
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSelectGroup(group.name);
                    }}
                    className="w-4 h-4 rounded border-gray-400 bg-white text-blue-500 focus:ring-blue-500 focus:ring-1"
                  />
                </div>
                
                {/* Group Info in Main Item Column */}
                <div 
                  className="px-4 py-3 border-r border-gray-200 flex-shrink-0 flex items-center space-x-2 cursor-pointer sticky left-12 bg-white z-20"
                  style={{ 
                    width: columnWidths['item'] || 120,
                    minWidth: '80px',
                    maxWidth: 'none'
                  }}
                  onClick={() => toggleGroup(group.name)}
                >
                  {group.collapsed ? (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  )}
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    group.name === 'New Leads' ? 'bg-cyan-500' :
                    group.name === 'Need Attention' ? 'bg-yellow-500' :
                    group.name === 'Sent Estimate' ? 'bg-purple-500' :
                    group.name === 'Signed' ? 'bg-emerald-500' :
                    group.name === 'In Progress' ? 'bg-blue-500' :
                    group.name === 'Complete' ? 'bg-green-500' :
                    'bg-gray-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    group.name === 'New Leads' ? 'text-cyan-700' :
                    group.name === 'Need Attention' ? 'text-yellow-700' :
                    group.name === 'Sent Estimate' ? 'text-purple-700' :
                    group.name === 'Signed' ? 'text-emerald-700' :
                    group.name === 'In Progress' ? 'text-blue-700' :
                    group.name === 'Complete' ? 'text-green-700' :
                    'text-gray-700'
                  }`}>{group.name}</span>
                  <span className="text-sm text-gray-500 font-medium">({group.items.length})</span>
                </div>
                
                {/* Main column headers on group header row */}
                {columns.slice(1).map((column) => (
                  <div 
                    key={`group-${group.name}-${column.id}`}
                    className={`px-2 py-1.5 border-r flex-shrink-0 bg-white z-5 ${
                      group.name === 'New Leads' ? 'border-cyan-200' :
                      group.name === 'Need Attention' ? 'border-yellow-200' :
                      group.name === 'Sent Estimate' ? 'border-purple-200' :
                      group.name === 'Signed' ? 'border-emerald-200' :
                      group.name === 'In Progress' ? 'border-blue-200' :
                      group.name === 'Complete' ? 'border-green-200' :
                      'border-gray-200'
                    }`}
                    style={{ 
                      width: columnWidths[column.id] || 100,
                      minWidth: '70px',
                      maxWidth: 'none'
                    }}
                  >
                    {/* Main column header */}
                    <div className="flex items-center justify-center w-full">
                      <span className={`text-sm font-medium uppercase tracking-wide text-center ${
                        group.name === 'New Leads' ? 'text-cyan-600' :
                        group.name === 'Need Attention' ? 'text-yellow-600' :
                        group.name === 'Sent Estimate' ? 'text-purple-600' :
                        group.name === 'Signed' ? 'text-emerald-600' :
                        group.name === 'In Progress' ? 'text-blue-600' :
                        group.name === 'Complete' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {column.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {/* Column type indicator */}
                        {column.type === 'status' && <div className={`w-2 h-2 rounded-full ${
                          group.name === 'New Leads' ? 'bg-cyan-400/60' :
                          group.name === 'Need Attention' ? 'bg-yellow-400/60' :
                          group.name === 'Sent Estimate' ? 'bg-purple-400/60' :
                          group.name === 'Signed' ? 'bg-emerald-400/60' :
                          group.name === 'In Progress' ? 'bg-blue-400/60' :
                          group.name === 'Complete' ? 'bg-green-400/60' :
                          'bg-gray-400/60'
                        }`}></div>}
                        {column.type === 'text' && <Type className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-500/80' :
                          group.name === 'Need Attention' ? 'text-yellow-500/80' :
                          group.name === 'Sent Estimate' ? 'text-purple-500/80' :
                          group.name === 'Signed' ? 'text-emerald-500/80' :
                          group.name === 'In Progress' ? 'text-blue-500/80' :
                          group.name === 'Complete' ? 'text-green-500/80' :
                          'text-gray-500/80'
                        }`} />}
                        {column.type === 'date' && <Calendar className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-500/80' :
                          group.name === 'Need Attention' ? 'text-yellow-500/80' :
                          group.name === 'Sent Estimate' ? 'text-purple-500/80' :
                          group.name === 'Signed' ? 'text-emerald-500/80' :
                          group.name === 'In Progress' ? 'text-blue-500/80' :
                          group.name === 'Complete' ? 'text-green-500/80' :
                          'text-gray-500/80'
                        }`} />}
                        {column.type === 'people' && <Users className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-500/80' :
                          group.name === 'Need Attention' ? 'text-yellow-500/80' :
                          group.name === 'Sent Estimate' ? 'text-purple-500/80' :
                          group.name === 'Signed' ? 'text-emerald-500/80' :
                          group.name === 'In Progress' ? 'text-blue-500/80' :
                          group.name === 'Complete' ? 'text-green-500/80' :
                          'text-gray-500/80'
                        }`} />}
                        {column.type === 'number' && <Hash className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-500/80' :
                          group.name === 'Need Attention' ? 'text-yellow-500/80' :
                          group.name === 'Sent Estimate' ? 'text-purple-500/80' :
                          group.name === 'Signed' ? 'text-emerald-500/80' :
                          group.name === 'In Progress' ? 'text-blue-500/80' :
                          group.name === 'Complete' ? 'text-green-500/80' :
                          'text-gray-500/80'
                        }`} />}
                        {column.type === 'tags' && <Tag className={`w-3 h-3 ${
                          group.name === 'New Leads' ? 'text-cyan-500/80' :
                          group.name === 'Need Attention' ? 'text-yellow-500/80' :
                          group.name === 'Sent Estimate' ? 'text-purple-500/80' :
                          group.name === 'Signed' ? 'text-emerald-500/80' :
                          group.name === 'In Progress' ? 'text-blue-500/80' :
                          group.name === 'Complete' ? 'text-green-500/80' :
                          'text-gray-500/80'
                        }`} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Group Items */}
              {!group.collapsed && (
                <>
                  {group.items.map((item) => (
                    <React.Fragment key={item.id}>
                      {/* Main Item Row - Clickable for Updates */}
                      <div 
                        className="flex hover:bg-gray-50 transition-all border-b border-gray-200 last:border-b-0 bg-white cursor-pointer"
                        onClick={(e) => {
                          // Only trigger if not clicking on a form element or checkbox
                          const target = e.target as HTMLElement;
                          if (!target.closest('input, select, button')) {
                            handleToggleUpdates(item.id);
                          }
                        }}
                      >
                        {/* Selection checkbox - standardized width */}
                        <div className="w-12 px-2 py-3 border-r border-gray-200 flex items-center justify-center sticky left-0 bg-white z-20">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(item.id);
                            }}
                            className="w-4 h-4 rounded border-gray-400 bg-white text-blue-500 focus:ring-blue-500 focus:ring-1"
                          />
                        </div>
                        {columns.map((column, index) => (
                          <div 
                            key={`${item.id}-${column.id}`} 
                            className={`px-4 py-3 border-r border-gray-200 flex-shrink-0 flex items-center bg-white ${
                              index === 0 ? 'sticky left-12 z-20 justify-start' : 'z-5 justify-center'
                            }`}
                            style={{ 
                              width: columnWidths[column.id] || (index === 0 ? 120 : 140),
                              minWidth: index === 0 ? '80px' : '100px',
                              maxWidth: 'none'
                            }}
                          >
                            {renderCell(item, column)}
                          </div>
                        ))}
                      </div>


                      
                      {/* Sub-Items Rows (when expanded) */}
                      {expandedSubItems.has(item.id) && (
                        <>

                          {/* Render folders and their sub-items */}
                          {item.subItemFolders && item.subItemFolders.length > 0 ? (
                            <>
                              {item.subItemFolders
                                .sort((a, b) => a.order - b.order)
                                .map((folder) => {
                                  const folderSubItems = item.subItems?.filter(subItem => subItem.folderId === folder.id) || [];
                                  const isFolderExpanded = expandedFolders.has(folder.id);
                                  const isEditingThisFolder = editingFolder === folder.id;
                                  const currentFolderName = folderNames[folder.id] || folder.name;
                                  
                                  return (
                                    <React.Fragment key={folder.id}>
                                      {/* Folder Header with Column Headers */}
                                      <div className="group flex hover:bg-gray-50 transition-all bg-white border-b-2 border-blue-200 shadow-sm">
                                        {/* Empty space where checkbox used to be */}
                                        <div className="w-12 px-2 py-2 border-r border-blue-200 flex items-center justify-center sticky left-0 bg-white z-30">
                                        </div>
                                        
                                        {/* Folder name with expand/collapse */}
                                        <div 
                                          className="px-4 py-3 border-r border-blue-200 flex-shrink-0 sticky left-12 bg-white z-20 flex items-center"
                                          style={{ 
                                            width: columnWidths['item'] || 120,
                                            minWidth: '80px',
                                            maxWidth: 'none'
                                          }}
                                        >
                                          <div className="flex items-center gap-2 text-sm w-full">
                                            {/* Delete folder button - moved to left */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteSubItemFolder(folder.id);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 transition-all flex-shrink-0"
                                              title="Delete folder"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            
                                            <div className="w-4 h-px bg-blue-300"></div>
                                            
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedFolders(prev => 
                                                  prev.has(folder.id) 
                                                    ? new Set(Array.from(prev).filter(id => id !== folder.id))
                                                    : new Set([...Array.from(prev), folder.id])
                                                );
                                              }}
                                              className="p-0.5 hover:bg-blue-100 rounded transition-colors flex-shrink-0"
                                            >
                                              <ChevronRight className={`w-3.5 h-3.5 text-blue-600 transition-transform ${
                                                expandedFolders.has(folder.id) ? 'rotate-90' : ''
                                              }`} />
                                            </button>
                                            
                                            {/* Count number - moved to left of folder icon */}
                                            <span className="text-blue-600 text-xs font-medium whitespace-nowrap flex-shrink-0 bg-blue-50 px-1.5 rounded">
                                              ({folderSubItems.length})
                                            </span>
                                            
                                            <Folder className="w-4 h-4 text-blue-600 drop-shadow-sm flex-shrink-0" />
                                            
                                            <div className="flex items-center gap-0.5 min-w-0 flex-1">
                                              {isEditingThisFolder ? (
                                                <input
                                                  type="text"
                                                  value={currentFolderName}
                                                  onChange={(e) => setFolderNames(prev => ({...prev, [folder.id]: e.target.value}))}
                                                  onBlur={() => setEditingFolder(null)}
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      setEditingFolder(null);
                                                    } else if (e.key === 'Escape') {
                                                      setFolderNames(prev => ({...prev, [folder.id]: folder.name}));
                                                      setEditingFolder(null);
                                                    }
                                                  }}
                                                  className="bg-blue-50 text-blue-900 text-sm font-semibold px-2 py-1 border border-blue-300 rounded focus:outline-none focus:border-blue-400 focus:bg-blue-100 flex-1 min-w-0"
                                                  autoFocus
                                                />
                                              ) : (
                                                <span 
                                                  className="text-blue-900 text-sm font-semibold cursor-pointer hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-100 transition-colors truncate"
                                                  onClick={() => setEditingFolder(folder.id)}
                                                  title={currentFolderName}
                                                >
                                                  {currentFolderName}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Column headers using exact same columns as main board for perfect alignment */}
                                        {columns.slice(1).map((column, index) => {
                                          // Use main board columns for perfect alignment
                                          const columnWidth = columnWidths[column.id] || (index === 0 ? 120 : 140);
                                          
                                          return (
                                          <div 
                                            key={`folder-header-${folder.id}-${column.id}`}
                                            className="px-3 py-3 border-r border-gray-200 flex-shrink-0 flex items-center gap-2 relative group bg-white z-5"
                                            style={{ 
                                              width: columnWidth,
                                              minWidth: index === 0 ? '80px' : '90px',
                                              maxWidth: 'none'
                                            }}
                                          >
                                            <div className="text-gray-400">{getColumnIcon(column.type)}</div>
                                            <span className="font-medium text-xs text-gray-500">{column.name}</span>
                                            
                                            {/* Column Resizer - matches main board */}
                                            {index < columns.slice(1).length - 1 && (
                                              <div 
                                                className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center bg-transparent hover:bg-blue-500/20 transition-all group touch-none"
                                                onPointerDown={(e) => handlePointerDown(column.id, e)}
                                                title="Resize"
                                                style={{ touchAction: 'none' }}
                                              >
                                                <div className="w-0.5 h-4 bg-gray-600 hover:bg-blue-400 rounded-full transition-all duration-200 group-hover:h-5 group-hover:bg-blue-400"></div>
                                              </div>
                                            )}
                                          </div>
                                          );
                                        })}
                                        
                                        {/* Folder checkbox positioned on the right */}
                                        <div className="w-12 px-2 py-3 flex items-center justify-center ml-auto bg-gradient-to-r from-blue-950/10 to-slate-950/5">
                                          <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded border-blue-500/50 bg-blue-900/30 text-blue-400 focus:ring-blue-400 focus:ring-1"
                                          />
                                        </div>
                                      </div>
                                      
                                      {/* Sub-items in this folder */}
                                      {expandedFolders.has(folder.id) && (
                                        <>
                                          {/* Folder content container - no indentation for perfect alignment */}
                                          <div className="relative">
                                            
                                            {folderSubItems.map((subItem, index) => (
                                              <div key={`sub-${subItem.id}`} className="group flex hover:bg-blue-50/50 transition-all bg-blue-50/20 border-b border-blue-200/60 relative">
                                                {/* Sub-item checkbox - visually distinct */}
                                                <div className="w-12 px-2 py-3 border-r border-blue-200 flex items-center justify-center sticky left-0 bg-blue-50/30 z-30">
                                                  <input 
                                                    type="checkbox" 
                                                    className="w-3.5 h-3.5 rounded border-blue-400 bg-white text-blue-600 focus:ring-blue-500 focus:ring-1"
                                                    />
                                                </div>
                                                
                                                {/* Sub-item name - visually distinct as nested item */}
                                                <div 
                                                  className="px-4 py-3 border-r border-blue-200 flex-shrink-0 sticky left-12 bg-blue-50/30 z-20 flex items-center"
                                                  style={{ 
                                                    width: (columnWidths['item'] || 120),
                                                    minWidth: '80px',
                                                    maxWidth: 'none'
                                                  }}
                                                >
                                                  <div className="flex items-center gap-3 text-sm w-full">
                                                    {/* Enhanced hierarchy indicator */}
                                                    <div className="flex items-center gap-1.5">
                                                      <div className="w-4 h-px bg-blue-400/60"></div>
                                                      <div className="w-2 h-2 rounded-full bg-blue-600 border border-blue-400 flex-shrink-0"></div>
                                                    </div>
                                                    
                                                    {editingSubItem === subItem.id ? (
                                                      <input
                                                        type="text"
                                                        value={subItemNames[subItem.id] || subItem.name}
                                                        onChange={(e) => setSubItemNames(prev => ({...prev, [subItem.id]: e.target.value}))}
                                                        onBlur={() => {
                                                          handleUpdateSubItemName(subItem.id, subItemNames[subItem.id] || subItem.name);
                                                          setEditingSubItem(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                          if (e.key === 'Enter') {
                                                            handleUpdateSubItemName(subItem.id, subItemNames[subItem.id] || subItem.name);
                                                            setEditingSubItem(null);
                                                          } else if (e.key === 'Escape') {
                                                            setSubItemNames(prev => ({...prev, [subItem.id]: subItem.name}));
                                                            setEditingSubItem(null);
                                                          }
                                                        }}
                                                        className="bg-white text-gray-900 text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-400 flex-1"
                                                        autoFocus
                                                      />
                                                    ) : (
                                                      <span 
                                                        className="cursor-pointer hover:text-blue-700 text-blue-800 text-sm font-medium flex-1"
                                                        onClick={() => {
                                                          setEditingSubItem(subItem.id);
                                                          setSubItemNames(prev => ({...prev, [subItem.id]: subItem.name}));
                                                        }}
                                                      >
                                                        {subItem.name}
                                                      </span>
                                                    )}
                                                    
                                                    {/* Delete sub-item button */}
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteSubItem(subItem.id);
                                                      }}
                                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 transition-all"
                                                      title="Delete sub-item"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                                
                                                {/* Sub-item cells using exact same columns as main board */}
                                                {columns.slice(1).map((column, index) => {
                                                  // Use main board columns for perfect alignment
                                                  const columnWidth = columnWidths[column.id] || (index === 0 ? 120 : 140);
                                                  
                                                  return (
                                                  <div 
                                                    key={`sub-${subItem.id}-${column.id}`}
                                                    className={`px-4 py-3 border-r border-blue-200 flex-shrink-0 flex items-center justify-center bg-blue-50/30 z-5`}
                                                    style={{ 
                                                      width: columnWidth,
                                                      minWidth: index === 0 ? '80px' : '90px',
                                                      maxWidth: 'none'
                                                    }}
                                                  >
                                                    {/* Render editable sub-item data based on column types */}
                                                    <div className="text-xs text-blue-800 text-center w-full font-medium">
                                                      {column.type === 'status' && (
                                                        <select
                                                          value={subItem.status || 'not_started'}
                                                          onChange={(e) => handleUpdateSubItem(subItem.id, { status: e.target.value })}
                                                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 bg-transparent cursor-pointer hover:bg-blue-500/20 transition-colors ${
                                                            subItem.status === 'not_started' ? 'bg-gray-600/30 text-gray-300' :
                                                            subItem.status === 'in_progress' ? 'bg-blue-600/30 text-blue-300' :
                                                            subItem.status === 'completed' ? 'bg-green-600/30 text-green-300' :
                                                            'bg-gray-600/30 text-gray-300'
                                                          }`}
                                                        >
                                                          <option value="not_started">Not Started</option>
                                                          <option value="in_progress">In Progress</option>
                                                          <option value="completed">Completed</option>
                                                        </select>
                                                      )}
                                                      {column.type === 'people' && (
                                                        <Select
                                                          value={subItem.assignedTo || 'unassigned'}
                                                          onValueChange={(newValue) => {
                                                            if (newValue === "__add_person__") {
                                                              setIsAddPersonModalOpen(true);
                                                            } else {
                                                              handleUpdateSubItem(subItem.id, { assignedTo: newValue === 'unassigned' ? '' : newValue });
                                                            }
                                                          }}
                                                        >
                                                          <SelectTrigger className="h-6 text-xs border-none bg-transparent text-blue-300 hover:bg-blue-500/10 transition-colors p-0 min-h-0">
                                                            <SelectValue placeholder="Assign" />
                                                          </SelectTrigger>
                                                          <SelectContent className="bg-gray-800 border-gray-700">
                                                            <SelectItem value="unassigned" className="text-white hover:text-gray-200">Unassigned</SelectItem>
                                                            {teamMembers.map((member: any) => (
                                                              <SelectItem key={member.id} value={member.id.toString()} className="text-white hover:text-gray-200">
                                                                {member.firstName} {member.lastName}
                                                              </SelectItem>
                                                            ))}
                                                            <div className="border-t border-gray-700 my-1"></div>
                                                            <SelectItem value="__add_person__" className="text-blue-400 hover:text-blue-300">
                                                              <UserPlus className="w-3 h-3 mr-2 inline" />
                                                              Add Person...
                                                            </SelectItem>
                                                          </SelectContent>
                                                        </Select>
                                                      )}
                                                      {column.type === 'text' && (
                                                        <input
                                                          type="text"
                                                          value={(subItem as any).notes || ''}
                                                          onChange={(e) => handleUpdateSubItem(subItem.id, { notes: e.target.value })}
                                                          placeholder="Add notes..."
                                                          className="w-full bg-transparent text-gray-300 text-center border-0 outline-none hover:bg-blue-500/10 focus:bg-blue-500/20 transition-colors px-1 py-1 rounded"
                                                        />
                                                      )}
                                                      {column.type === 'date' && (
                                                        <input
                                                          type="date"
                                                          value={(subItem as any).dueDate || ''}
                                                          onChange={(e) => handleUpdateSubItem(subItem.id, { dueDate: e.target.value })}
                                                          className="w-full bg-transparent text-gray-400 text-center border-0 outline-none hover:bg-blue-500/10 focus:bg-blue-500/20 transition-colors px-1 py-1 rounded text-xs"
                                                        />
                                                      )}
                                                      {column.type === 'number' && (
                                                        <input
                                                          type="number"
                                                          value={(subItem as any).priority || ''}
                                                          onChange={(e) => handleUpdateSubItem(subItem.id, { priority: parseInt(e.target.value) || 0 })}
                                                          placeholder="Priority"
                                                          className="w-full bg-transparent text-blue-700 text-center border-0 outline-none hover:bg-blue-500/10 focus:bg-blue-500/20 transition-colors px-1 py-1 rounded font-medium"
                                                        />
                                                      )}
                                                      {column.type === 'tags' && (
                                                        <input
                                                          type="text"
                                                          value={(() => {
                                                            try {
                                                              const tags = (subItem as any).tags;
                                                              if (Array.isArray(tags)) return tags.join(', ');
                                                              if (typeof tags === 'string') return JSON.parse(tags).join(', ');
                                                              return '';
                                                            } catch {
                                                              return '';
                                                            }
                                                          })()}
                                                          onChange={(e) => {
                                                            const tagArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                                                            handleUpdateSubItem(subItem.id, { tags: tagArray });
                                                          }}
                                                          placeholder="Add tags..."
                                                          className="w-full bg-transparent text-blue-700 text-center border-0 outline-none hover:bg-blue-500/10 focus:bg-blue-500/20 transition-colors px-1 py-1 rounded font-medium text-xs"
                                                        />
                                                      )}
                                                      {column.type === 'subitems' && (
                                                        <div className="text-center text-blue-600 font-medium text-xs">
                                                          Sub Item
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  );
                                                })}
                                              </div>
                                            ))}
                                            
                                            {/* Add Sub Item button - blue theme */}
                                            <div className="flex hover:bg-blue-100/50 transition-all border-b border-blue-200 bg-blue-50/10 relative">
                                              {/* Empty checkbox space */}
                                              <div className="w-12 px-2 py-2 border-r border-blue-200 sticky left-0 bg-blue-50/20 z-30"></div>
                                              <div 
                                                className="px-4 py-2 flex-shrink-0 sticky left-12 bg-blue-50/20 z-20"
                                                style={{ 
                                                  width: (columnWidths['item'] || 120),
                                                  minWidth: '80px',
                                                  maxWidth: 'none'
                                                }}
                                              >
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleAddSubItemToFolder(item.id, folder.id)}
                                                  className="text-blue-700 hover:text-blue-800 hover:bg-blue-100 text-sm h-8 px-3 flex items-center gap-2 border border-blue-400 hover:border-blue-500 rounded-md transition-all font-medium"
                                                >
                                                  <Plus className="w-4 h-4" />
                                                  Add Sub Item
                                                </Button>
                                              </div>
                                              
                                              {/* Empty cells using exact same columns as main board */}
                                              {columns.slice(1).map((column, index) => {
                                                const columnWidth = columnWidths[column.id] || (index === 0 ? 120 : 140);
                                                
                                                return (
                                                <div 
                                                  key={`add-sub-${folder.id}-${column.id}`}
                                                  className="px-4 py-3 border-r border-gray-200 flex-shrink-0 bg-white z-5"
                                                  style={{ 
                                                    width: columnWidth,
                                                    minWidth: index === 0 ? '80px' : '90px',
                                                    maxWidth: 'none'
                                                  }}
                                                />
                                                )
                                              })}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </React.Fragment>
                                  );
                                })}

                              {/* Add Folder Section - positioned after all folders */}
                              <div className="flex hover:bg-blue-500/5 transition-all border-b border-blue-500/10">
                                {/* Empty checkbox space - moved to right */}
                                <div className="w-12 px-2 py-2 border-r border-blue-500/20 sticky left-0 bg-white z-20"></div>
                                <div 
                                  className="px-4 py-2 flex-shrink-0 sticky left-12 bg-white z-10"
                                  style={{ 
                                    width: columnWidths['item'] || 120,
                                    minWidth: '80px',
                                    maxWidth: 'none'
                                  }}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddSubItemFolder(item.id)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm h-8 px-3 flex items-center gap-2 font-medium border border-blue-300 hover:border-blue-400 rounded-md transition-all"
                                  >
                                    <Folder className="w-4 h-4" />
                                    Add Folder
                                  </Button>
                                </div>
                                
                                {/* Column spaces using exact same columns as main board */}
                                {columns.slice(1).map((column, index) => (
                                  <div 
                                    key={`addfolder-${item.id}-${column.id}`}
                                    className="px-4 py-3 border-r border-gray-200 flex-shrink-0"
                                    style={{ 
                                      width: columnWidths[column.id] || (index === 0 ? 120 : 140),
                                      minWidth: index === 0 ? '80px' : '90px',
                                      maxWidth: 'none'
                                    }}
                                  />
                                ))}
                                
                                {/* Checkbox positioned on the right */}
                                <div className="w-12 px-2 py-2 flex items-center justify-center ml-auto">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-blue-500/50 bg-blue-900/30 text-blue-400 focus:ring-blue-400 focus:ring-1"
                                  />
                                </div>
                              </div>
                          </>
                        ) : (
                            // Fallback: render sub-items without folders if no folders exist
                            item.subItems?.map((subItem) => (
                              <div key={`sub-${subItem.id}`} className="flex hover:bg-gray-50 transition-all bg-white border-b border-gray-200">
                                {/* Empty checkbox space for sub-items */}
                                <div className="w-8 px-1 py-0.5 border-r border-gray-200 flex items-center justify-center sticky left-0 bg-white z-20">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                </div>
                                
                                {/* Sub-item name (first column) */}
                                <div 
                                  className="px-2 py-0.5 border-r border-gray-200 flex-shrink-0 sticky left-8 bg-white z-10 flex items-center"
                                  style={{ 
                                    width: columnWidths['item'] || 200,
                                    minWidth: '150px',
                                    maxWidth: 'none'
                                  }}
                                >
                                  <div className="flex items-center gap-1 text-xs text-gray-700">
                                    <div className="w-3 h-px bg-gray-400 mr-1"></div>
                                    <span>{subItem.name}</span>
                                  </div>
                                </div>
                                
                                {/* Sub-item dedicated columns */}
                                {subItemColumns.map((column) => (
                                  <div 
                                    key={`sub-${subItem.id}-${column.id}`}
                                    className="px-2 py-0.5 border-r border-gray-200 flex-shrink-0"
                                    style={{ 
                                      width: columnWidths[column.id] || 120,
                                      minWidth: '80px',
                                      maxWidth: 'none'
                                    }}
                                  >
                                    {renderSubItemCell(subItem, column, item.id)}
                                  </div>
                                ))}
                              </div>
                            ))
                          )}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                  
                  {/* Add Item Button at bottom of group */}
                  <div className="flex hover:bg-gray-50 transition-all">
                    {/* Empty checkbox space */}
                    <div className="w-8 px-1 py-0.5 border-r border-gray-200 sticky left-0 bg-white z-20"></div>
                    <div 
                      className="px-2 py-0.5 flex-shrink-0 sticky left-8 bg-white z-10"
                      style={{ 
                        width: columnWidths['item'] || 200,
                        minWidth: '150px',
                        maxWidth: 'none'
                      }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addItemMutation.mutate(group.name)}
                        disabled={addItemMutation.isPending}
                        className="text-gray-600 hover:text-blue-600 text-sm h-7 w-full justify-start px-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add item
                      </Button>
                    </div>
                    {columns.slice(1).map((column) => (
                      <div 
                        key={column.id} 
                        className="px-2 py-1.5 border-r border-gray-200 flex-shrink-0"
                        style={{ 
                          width: columnWidths[column.id] || 100,
                          minWidth: '70px',
                          maxWidth: 'none'
                        }}
                      ></div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Compact Status Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-xs text-gray-600 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <span>{boardItems.length} items</span>
          <span>•</span>
          <span>{columns.length} columns</span>
          <span>•</span>
          <span>{boardGroups.length} groups</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
          <span>Live</span>
        </div>
      </div>

      {/* Sleek Bulk Operations Popup */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-1 duration-200">
          <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700/50 px-4 py-2 mx-4 mb-4 rounded-lg shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-xs font-medium text-white">
                  {selectedItems.size}
                </div>
                <span className="text-sm text-gray-300">
                  {selectedItems.size === 1 ? 'item selected' : 'items selected'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => bulkArchiveMutation.mutate(Array.from(selectedItems))}
                  disabled={bulkArchiveMutation.isPending}
                  className="text-xs h-7 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Archive
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => bulkTrashMutation.mutate(Array.from(selectedItems))}
                  disabled={bulkTrashMutation.isPending}
                  className="text-xs h-7 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Trash
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => bulkDeleteMutation.mutate(Array.from(selectedItems))}
                  disabled={bulkDeleteMutation.isPending}
                  className="text-xs h-7 px-3 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  Delete
                </Button>
                <div className="w-px h-4 bg-gray-700"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedItems(new Set())}
                  className="text-xs h-7 px-2 text-gray-500 hover:text-gray-300"
                >
                  ✕
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Updates Side Panel */}
      {sidePanelOpen && selectedMainItem && (
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {/* Side Panel Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Project Updates</h3>
              <p className="text-xs text-gray-600">{selectedMainItem.values.item || `Project #${selectedMainItem.id}`}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSidePanelOpen(false);
                setSelectedMainItem(null);
              }}
              className="text-gray-600 hover:text-gray-900 p-1"
            >
              ✕
            </Button>
          </div>

          {/* Updates Content */}
          <div className="flex-1 overflow-auto p-4">
            {/* Updates List */}
            <div className="space-y-4 mb-6">
              {updatesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : projectUpdates.length > 0 ? (
                projectUpdates.map((update: any) => (
                  <div key={update.id} className="flex space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-600 mb-1">
                        <span className="text-gray-900 font-medium">{user?.username || 'User'}</span> · {new Date(update.createdAt).toLocaleDateString()}
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-800">{update.content}</p>
                        {update.attachments && update.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {update.attachments.map((file: any, index: number) => (
                              <div key={index} className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                                📎 {file.fileName}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-600 text-sm">
                  No updates yet. Be the first to add an update for this project.
                </div>
              )}
            </div>

            {/* Add Update Form */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white font-medium">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <textarea
                    value={updateContent}
                    onChange={(e) => setUpdateContent(e.target.value)}
                    placeholder="Add an update or comment..."
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={isPosting}
                  />
                  
                  {/* File Upload Area */}
                  <div className="mt-2">
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
                      className="hidden"
                      id="file-upload"
                      accept="image/*,application/pdf,.doc,.docx,.txt"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-2 py-1 text-xs text-gray-400 hover:text-gray-300 cursor-pointer border border-gray-600 rounded hover:border-gray-500 transition-colors"
                    >
                      📎 Attach Files
                    </label>
                    
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between text-xs text-gray-400 bg-gray-700 rounded px-2 py-1">
                            <span>📎 {file.name}</span>
                            <button
                              onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                              className="text-red-400 hover:text-red-300 ml-2"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end mt-3 space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs border-gray-600 text-gray-400 hover:bg-gray-700"
                      onClick={() => {
                        setUpdateContent('');
                        setSelectedFiles([]);
                      }}
                      disabled={isPosting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                      onClick={handlePostUpdate}
                      disabled={!updateContent.trim() || isPosting}
                    >
                      {isPosting ? 'Posting...' : 'Post Update'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Person to Project Modal */}
      <Dialog open={isAddPersonModalOpen} onOpenChange={setIsAddPersonModalOpen}>
        <DialogContent className="bg-white text-gray-900 border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add Person to Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm text-gray-700 font-medium">First Name *</Label>
