// ABOUTME: Renders the Service Requests "Add New" form experience as a panel component.
// ABOUTME: Preserves the original sections and slide-out helpers without the left metadata column.
import { useEffect, useState, useRef } from 'react';
import type { TicketHistoryRow } from '../types/qalert';
import type { Submitter } from '../types/qalert';
import { WhereTab } from './WhereTab';
import {
  Info,
  Plus,
  Settings,
  MapPin,
  Search,
  MessageCircle,
  AlertCircle,
  Pencil,
  ChevronDown,
  ChevronRight,
  Send,
  X,
  Globe2 } from
'lucide-react';

const REUSABLE_COMMENTS = [
  'A service request has been created and forwarded to the appropriate division for review. A representative may contact you if additional information is required to properly address the matter.',
  "Thanks for bringing this to our attention. We are looking into your question and we'll be in touch within the next couple of days with more information.",
  'Submitter called to check on request.',
  "Thanks for bringing this to our attention. It will take a few more days to check into your concern and we'll get in touch once we do. Thanks for your patience. If you have any immediate concerns in the meantime, feel free to get in touch.",
  'Given to supervisor for review and assignment.',
  'We have received your request and it has been assigned to the appropriate department. You will be contacted if additional information is needed.',
  'This request has been completed. Please let us know if you have any further questions.',
];
const REQUEST_TYPE_DATA: {
  category: string;
  items: string[];
}[] = [
{
  category: 'A Job Well Done!',
  items: []
},
{
  category: 'Animal Issues',
  items: ['Animal Complaint', 'Dead Animal Removal', 'Stray Animal']
},
{
  category: 'Ask Us',
  items: ['General Question', 'Service Inquiry']
},
{
  category: 'Building Department Administration',
  items: []
},
{
  category: 'Business Inquiry',
  items: ['New Business License', 'Business Tax Receipt']
},
{
  category: 'Business Navigator',
  items: ['Zoning Question', 'Permit Inquiry']
},
{
  category: 'City Council Administrative Request',
  items: []
},
{
  category: 'City Manager Administrative Request',
  items: ['Budget Question', 'Policy Inquiry']
},
{
  category: 'City Projects',
  items: ['Road Construction', 'Park Improvement']
},
{
  category: 'Code Compliance/Code Issues',
  items: ['Overgrown Lot', 'Abandoned Vehicle', 'Noise Complaint']
},
{
  category: 'Commercial Construction Issues',
  items: ['Permit Delay', 'Inspection Request']
},
{
  category: 'Community Programs / Neighborhood Services',
  items: ['Event Request', 'Volunteer Signup']
},
{
  category: 'Drainage Issue',
  items: ['Flooding', 'Clogged Drain', 'Swale Maintenance']
},
{
  category: 'Environmental Concerns',
  items: [
  'Dumping Hazardous Waste (Land-base only)',
  'Dumping Yard Waste in Canal/Waterway',
  'Water Quality Concern']

},
{
  category: 'Solid Waste (Garbage/Recycling/Yard Waste)',
  items: [
  'Report an Issue > Illegal Dumping',
  'Missed Pickup',
  'Bulk Pickup Request']

}];

type KnowledgeBaseArticle = {
  id: string;
  title: string;
  categories: string;
  linkText: string;
};

const KNOWLEDGE_BASE_BY_CATEGORY: Record<string, KnowledgeBaseArticle[]> = {
  'Illegal Dumping': [
    {
      id: 'common-code-violations',
      title: 'Common Code Violations & Tips',
      categories: 'Code Compliance/Code Issues, Commercial Vehicle, Exterior (Structure), High Grass & Weeds, Illegal Dumping, Illegal Sign, Improper Parking, Inoperative Vehicle, Open Storage, Other Code Issue, Shutters Closed/Secured, Unsecured/Unmaintained Pool',
      linkText: 'Common Code Violations'
    }
  ]
};

interface ServiceRequestsFormPanelProps {
  headerPanel?: React.ReactNode;
  activeTicketId?: string | null;
  historyRows?: TicketHistoryRow[];
  residentFormData?: Partial<Submitter>;
  showRequiredErrors?: boolean;
  onSubmitterIdChange?: (submitterId: string | null) => void;
  onWhoRequiredChange?: (data: { firstName: string; lastName: string; notifPrefMet: boolean }) => void;
  onRequestTypeChange?: (requestType: string) => void;
  onCommentsChange?: (comments: string) => void;
  onAddressChange?: (address: string) => void;
  selectedSubmitterId?: string | null;
  initialRequestType?: string;
  initialComments?: string;
  initialAddress?: string;
}

function findRequestTypeSelection(typeName: string): { name: string; breadcrumb: string } | null {
  const normalized = typeName.trim().toLowerCase();
  if (!normalized) return null;
  for (const cat of REQUEST_TYPE_DATA) {
    for (const item of cat.items) {
      const parts = item.split(' > ');
      const itemName = parts[parts.length - 1];
      if (itemName.toLowerCase() === normalized) {
        return { name: itemName, breadcrumb: `${cat.category} > ${item}` };
      }
    }
  }
  return { name: typeName, breadcrumb: typeName };
}

function requiredMessage(text = 'Required') {
  return <div className="mt-1 text-[11px] text-red-600 font-medium">{text}</div>;
}

export function ServiceRequestsFormPanel({
  headerPanel,
  activeTicketId,
  historyRows,
  residentFormData,
  showRequiredErrors = false,
  onSubmitterIdChange,
  onWhoRequiredChange,
  onRequestTypeChange,
  onCommentsChange,
  onAddressChange,
  selectedSubmitterId,
  initialRequestType,
  initialComments,
  initialAddress,
}: ServiceRequestsFormPanelProps) {
  const [requestTypeOpen, setRequestTypeOpen] = useState(false);
  const [requestTypeSearch, setRequestTypeSearch] = useState('');
  const [priority, setPriority] = useState(2);
  const [selectedRequestType, setSelectedRequestType] = useState<{
    name: string;
    breadcrumb: string;
  } | null>(() => findRequestTypeSelection(initialRequestType ?? ''));
  const [promptsPanelOpen, setPromptsPanelOpen] = useState(false);
  const [knowledgeBaseOpen, setKnowledgeBaseOpen] = useState(false);
  const [knowledgeBaseKeyword, setKnowledgeBaseKeyword] = useState('');
  const [knowledgeBaseCategory, setKnowledgeBaseCategory] = useState('');
  const [expandedKnowledgeArticleId, setExpandedKnowledgeArticleId] = useState<string | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentSearch, setCommentSearch] = useState('');
  const [comments, setComments] = useState(initialComments ?? '');
  const [privateNotes, setPrivateNotes] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredComments = commentSearch.trim()
    ? REUSABLE_COMMENTS.filter(c => c.toLowerCase().includes(commentSearch.toLowerCase()))
    : REUSABLE_COMMENTS;

  function insertComment(text: string) {
    setComments(prev => prev ? prev + '\n\n' + text : text);
    setCommentsOpen(false);
    setCommentSearch('');
  }
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
      dropdownRef.current &&
      !dropdownRef.current.contains(e.target as Node))
      {
        setRequestTypeOpen(false);
      }
    }
    if (requestTypeOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [requestTypeOpen]);
  const filteredRequestTypes = requestTypeSearch.trim() ?
  REQUEST_TYPE_DATA.map((cat) => {
    const searchLower = requestTypeSearch.toLowerCase();
    const matchingItems = cat.items.filter((item) =>
    item.toLowerCase().includes(searchLower)
    );
    const categoryMatches = cat.category.toLowerCase().includes(searchLower);
    if (categoryMatches || matchingItems.length > 0) {
      return {
        ...cat,
        items: categoryMatches ? cat.items : matchingItems
      };
    }
    return null;
  }).filter(Boolean) as {
    category: string;
    items: string[];
  }[] :
  null;

  const knowledgeArticles = KNOWLEDGE_BASE_BY_CATEGORY[knowledgeBaseCategory] ?? [];
  const knowledgeKeyword = knowledgeBaseKeyword.trim().toLowerCase();
  const filteredKnowledgeArticles = knowledgeKeyword ?
  knowledgeArticles.filter((article) =>
  article.title.toLowerCase().includes(knowledgeKeyword) ||
  article.categories.toLowerCase().includes(knowledgeKeyword) ||
  article.linkText.toLowerCase().includes(knowledgeKeyword)
  ) :
  knowledgeArticles;

  function openKnowledgeBase() {
    const defaultCategory = selectedRequestType?.name ?? '';
    setKnowledgeBaseCategory(defaultCategory);
    setKnowledgeBaseKeyword('');
    setExpandedKnowledgeArticleId(null);
    setPromptsPanelOpen(false);
    setCommentsOpen(false);
    setKnowledgeBaseOpen(true);
  }

  useEffect(() => {
    onRequestTypeChange?.(selectedRequestType?.name ?? '');
  }, [selectedRequestType, onRequestTypeChange]);

  useEffect(() => {
    onCommentsChange?.(comments);
  }, [comments, onCommentsChange]);

  // Hydrate What/Comments when ticket context changes (e.g. open in new tab).
  useEffect(() => {
    if (!activeTicketId) return;
    setSelectedRequestType(findRequestTypeSelection(initialRequestType ?? ''));
    setComments(initialComments ?? '');
  }, [activeTicketId, initialRequestType, initialComments]);

  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden bg-[#f5f5f5]">
      {headerPanel && <div className="px-4 pt-2 pb-1 shrink-0">{headerPanel}</div>}
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Right Content (Scrollable Form) */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#f5f5f5] relative">
          <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* HISTORY Section */}
            {activeTicketId && (
              <section className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-[#1e2b3c] text-white px-4 py-2 flex justify-between items-center">
                  <h3 className="font-bold text-sm">History</h3>
                  <button className="flex items-center text-xs hover:text-gray-300">
                    <Settings className="w-3.5 h-3.5 mr-1" /> Options
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f7f7f7] text-gray-700">
                      <tr>
                        <th className="text-left px-4 py-2 font-bold">Activity</th>
                        <th className="text-left px-4 py-2 font-bold">Date</th>
                        <th className="text-left px-4 py-2 font-bold">User</th>
                        <th className="text-left px-4 py-2 font-bold">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(historyRows ?? []).map((row, idx) => (
                        <tr key={`${row.activity}-${row.date}-${idx}`} className="border-t border-gray-200 align-top">
                          <td className="px-4 py-2 text-gray-700">{row.activity}</td>
                          <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{row.date}</td>
                          <td className="px-4 py-2 text-gray-700">{row.user}</td>
                          <td className="px-4 py-2 text-gray-700">{row.comments}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* WHO Section */}
            <WhoSection
              onSubmitterIdChange={onSubmitterIdChange}
              selectedSubmitterId={selectedSubmitterId}
              onWhoRequiredChange={onWhoRequiredChange}
              showRequiredErrors={showRequiredErrors}
            />

            {/* WHAT Section */}
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-[#1e2b3c] text-white px-4 py-2 flex justify-between items-center">
                <h3 className="font-bold text-sm">What</h3>
                <button
                  onClick={openKnowledgeBase}
                  className="flex items-center text-xs hover:text-gray-300">
                  <Info className="w-3.5 h-3.5 mr-1" /> Knowledge Base{' '}
                  {selectedRequestType && '(1)'}
                </button>
              </div>

              <div className="p-4">
                <div className="flex gap-8 mb-6">
                  <div className="flex-1 relative" ref={dropdownRef}>
                    <label className="block text-sm text-gray-700 mb-1">
                      Request Type<span className="text-red-500">*</span>
                    </label>
                    <div
                      className={`border ${(requestTypeOpen ? 'border-orange-400' : 'border-gray-300')} ${(showRequiredErrors && !selectedRequestType) ? '!border-red-500' : ''} rounded px-2 py-1.5 flex justify-between items-center cursor-pointer bg-white`}
                      onClick={() => {
                        setRequestTypeOpen(true);
                        setRequestTypeSearch('');
                      }}>
                      
                      {requestTypeOpen ?
                      <div className="relative w-full">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          autoFocus
                          type="text"
                          value={requestTypeSearch}
                          onChange={(e) => setRequestTypeSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full outline-none text-sm pl-5"
                          placeholder="Search request types" />
                      </div> :


                      <div className="relative w-full">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <span
                          className={`text-sm pl-5 ${selectedRequestType ? 'text-gray-900' : 'text-transparent select-none'}`}>
                            {selectedRequestType ? selectedRequestType.name : '.'}
                          </span>
                      </div>
                      }
                      <span className="text-xs ml-2 shrink-0">▼</span>
                    </div>
                    {selectedRequestType && !requestTypeOpen &&
                    <div
                      className="text-xs text-gray-400 mt-1 truncate"
                      title={selectedRequestType.breadcrumb}>
                      
                        {selectedRequestType.breadcrumb}
                      </div>
                    }
                    {showRequiredErrors && !selectedRequestType && requiredMessage('Request Type is required')}

                    {requestTypeOpen &&
                    <div className="absolute top-full left-0 right-0 mt-0 bg-white border border-gray-300 shadow-lg z-10 max-h-80 overflow-y-auto text-sm">
                        {filteredRequestTypes ?
                      <>
                            <div className="px-3 py-1.5 text-gray-400 text-sm italic border-b border-gray-200">
                              Search results
                            </div>
                            {filteredRequestTypes.length === 0 &&
                        <div className="px-3 py-3 text-gray-400 text-center">
                                No results found
                              </div>
                        }
                            {filteredRequestTypes.map((cat) =>
                        <div key={cat.category}>
                                <div className="px-3 py-1.5 font-bold text-gray-800 cursor-pointer hover:bg-blue-100">
                                  {cat.category}
                                </div>
                                {cat.items.map((item) => {
                            const parts = item.split(' > ');
                            const itemName = parts[parts.length - 1];
                            return (
                              <div
                                key={item}
                                className="cursor-pointer hover:bg-blue-100"
                                onClick={() => {
                                  setSelectedRequestType({
                                    name: itemName,
                                    breadcrumb: `${cat.category} > ${item}`
                                  });
                                  setRequestTypeOpen(false);
                                }}>
                                
                                      {parts.length > 1 ?
                                <>
                                          <div className="pl-8 py-0.5 font-bold text-gray-700">
                                            {parts[0]}
                                          </div>
                                          <div className="pl-14 py-0.5 text-gray-600">
                                            {parts[1]}
                                          </div>
                                        </> :

                                <div className="pl-8 py-1 text-gray-600">
                                          {item}
                                        </div>
                                }
                                    </div>);

                          })}
                              </div>
                        )}
                          </> :

                      REQUEST_TYPE_DATA.map((cat) =>
                      <div key={cat.category}>
                              <div className="px-3 py-1.5 font-bold text-gray-800 hover:bg-blue-100 cursor-pointer flex justify-between items-center">
                                {cat.category}
                                {cat.items.length > 0 &&
                          <span className="text-xs">▶</span>
                          }
                              </div>
                              {cat.items.map((item) => {
                          const parts = item.split(' > ');
                          const itemName = parts[parts.length - 1];
                          return (
                            <div
                              key={item}
                              className="pl-8 py-1 text-gray-600 hover:bg-blue-100 cursor-pointer"
                              onClick={() => {
                                setSelectedRequestType({
                                  name: itemName,
                                  breadcrumb: `${cat.category} > ${item}`
                                });
                                setRequestTypeOpen(false);
                              }}>
                              
                                    {item}
                                  </div>);

                        })}
                            </div>
                      )
                      }
                      </div>
                    }
                  </div>

                  <div className="flex-1">
                    <label className="block text-sm text-gray-700 mb-1">
                      Priority
                    </label>
                    <div className="relative mt-2">
                      <div className="h-3 flex-1 bg-gradient-to-r from-red-400 via-red-200 via-50% to-blue-300 rounded-full"></div>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={1}
                        value={priority}
                        onChange={(e) => setPriority(Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer h-3" />
                      
                      <div
                        className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-white border border-gray-300 rounded px-2 py-0.5 text-xs shadow-sm pointer-events-none select-none"
                        style={{
                          left: `${(priority - 1) / 2 * 100}%`
                        }}>
                        
                        {priority}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-8 mb-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-700">Comments<span className="text-red-500">*</span></label>
                      <div className="flex items-center space-x-3">
                        {selectedRequestType &&
                        <button
                          onClick={() => { setPromptsPanelOpen(true); setCommentsOpen(false); }}
                          className="flex items-center gap-1 bg-sky-100 text-sky-700 text-xs font-semibold px-2 py-0.5 rounded hover:bg-sky-200">
                            <AlertCircle className="w-3.5 h-3.5 fill-sky-500 text-white shrink-0" /> Prompts
                          </button>
                        }
                        <button
                          onClick={() => { setCommentsOpen(true); setPromptsPanelOpen(false); }}
                          className="text-green-600 text-xs flex items-center hover:underline">
                          <MessageCircle className="w-3 h-3 mr-1" /> Comments
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={comments}
                      onChange={e => setComments(e.target.value)}
                      className={`w-full border rounded h-32 p-2 text-sm resize-y outline-none focus:border-blue-400 ${(showRequiredErrors && !comments.trim()) ? 'border-red-500' : 'border-gray-300'}`} />
                    {showRequiredErrors && !comments.trim() && requiredMessage('Comments are required')}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-sm text-gray-700">Private Notes</label>
                      <button
                        onClick={() => { setCommentsOpen(true); setPromptsPanelOpen(false); }}
                        className="text-green-600 text-xs flex items-center hover:underline">
                        <MessageCircle className="w-3 h-3 mr-1" /> Comments
                      </button>
                    </div>
                    <textarea
                      value={privateNotes}
                      onChange={e => setPrivateNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded h-32 p-2 text-sm resize-y outline-none focus:border-blue-400" />
                  </div>
                </div>

                {selectedRequestType &&
                <div className="space-y-4 mb-6 mt-6">
                    {[
                  'Alex Rivera, District 1',
                  'Jordan Lee, District 2',
                  'Pat Williams, District 3',
                  'Sam Torres, District 4',
                  'Chris Hayes, Mayor',
                  'Notify Department Head'].
                  map((label) =>
                  <label
                    key={label}
                    className="flex items-center space-x-2 cursor-pointer">
                    
                        <input
                      type="checkbox"
                      className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500" />
                    
                        <span className="text-sm text-gray-800">{label}</span>
                      </label>
                  )}
                  </div>
                }

                <div className="flex items-center space-x-4 mt-2">
                  <button className="border border-green-600 text-green-600 px-3 py-1.5 rounded flex items-center text-sm hover:bg-green-50">
                    <Plus className="w-4 h-4 mr-1" /> Add Files
                  </button>
                  <span className="text-gray-500 text-sm">
                    Drag and drop files here to upload
                  </span>
                </div>
              </div>
            </div>

            <WhereSection
              activeTicketId={activeTicketId}
              initialAddress={initialAddress}
              onAddressChange={onAddressChange}
              residentFormData={residentFormData}
              showRequiredErrors={showRequiredErrors}
            />
          </div>
        </div>

        {/* Reusable Comments Slide-in Panel */}
        <div
          className="w-[360px] bg-white border-l border-gray-300 shadow-xl flex flex-col shrink-0 z-20 absolute right-0 top-0 bottom-0"
          style={{ transform: commentsOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.2s ease' }}
        >
          <div className="bg-[#f0f1f2] border-b border-gray-300 px-4 py-2 flex justify-between items-center h-10">
            <h2 className="font-bold text-gray-800 text-lg">Reusable Comments</h2>
            <div className="flex items-center space-x-2">
              <button className="text-gray-400 hover:text-gray-600 text-lg leading-none">⊕</button>
              <button className="text-gray-400 hover:text-gray-600 text-base leading-none">⚙</button>
              <button
                onClick={() => { setCommentsOpen(false); setCommentSearch(''); }}
                className="text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 rounded p-0.5">
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          </div>
          <div className="px-4 py-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search comments"
              value={commentSearch}
              onChange={e => setCommentSearch(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredComments.length === 0 ? (
              <div className="text-sm text-gray-400 p-4">No comments match your search.</div>
            ) : filteredComments.map((text, i) => (
              <div key={i} className="border-b border-gray-100 p-4">
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{text}</p>
                <button
                  onClick={() => insertComment(text)}
                  className="flex items-center gap-1.5 text-green-600 text-sm font-semibold hover:underline">
                  <span className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center shrink-0">
                    <Plus className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                  Insert
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Prompts Slide-in Panel */}
        <div
          className="w-[400px] bg-white border-l border-gray-300 shadow-xl flex flex-col shrink-0 z-30 absolute right-0 top-0 bottom-0"
          style={{ transform: promptsPanelOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.2s ease' }}
        >
          <div className="bg-[#f0f0f0] border-b border-gray-300 px-4 py-2 flex justify-between items-center h-10">
            <h2 className="font-bold text-gray-800 text-lg">Prompts</h2>
            <button
              onClick={() => setPromptsPanelOpen(false)}
              className="text-gray-400 hover:text-gray-600 bg-gray-200 hover:bg-gray-300 rounded p-0.5">
              <X className="w-4 h-4" strokeWidth={3} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {selectedRequestType ? (
              <PromptContent requestType={selectedRequestType.name} />
            ) : (
              <div className="text-sm text-gray-400">Select a request type to see prompts.</div>
            )}
          </div>
        </div>

        {/* Knowledge Base Slide-in Panel */}
        <div
          className="w-[520px] bg-[#f0f0f0] border-l border-gray-300 shadow-xl flex flex-col shrink-0 z-40 absolute right-0 top-0 bottom-0"
          style={{ transform: knowledgeBaseOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.2s ease' }}
        >
          <div className="bg-[#e9eaed] border-b border-gray-300 px-5 py-3 flex justify-between items-center">
            <h2 className="font-bold text-gray-700 text-[24px] leading-none">Knowledge Base</h2>
            <button
              onClick={() => setKnowledgeBaseOpen(false)}
              className="text-gray-300 hover:text-gray-400">
              <X className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>

          <div className="p-5 overflow-y-auto">
            <label className="block text-[14px] leading-none text-gray-700 mb-2">Search</label>
            <input
              value={knowledgeBaseKeyword}
              onChange={(e) => setKnowledgeBaseKeyword(e.target.value)}
              className="w-full h-11 border border-gray-400 rounded px-3 text-[14px] leading-none text-gray-700 bg-[#f5f5f5] outline-none focus:border-amber-500"
              placeholder="Keywords"
            />

            <label className="block text-[14px] leading-none text-gray-700 mt-4 mb-2">Category</label>
            <div className="h-11 border border-gray-400 rounded bg-[#f5f5f5] flex items-center justify-between px-2">
              <input
                value={knowledgeBaseCategory}
                onChange={(e) => setKnowledgeBaseCategory(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[14px] leading-none text-gray-700"
              />
              <div className="flex items-center">
                <button
                  onClick={() => setKnowledgeBaseCategory('')}
                  className="text-gray-400 hover:text-gray-500 px-2"
                  type="button">
                  <X className="w-5 h-5" strokeWidth={3} />
                </button>
                <span className="text-gray-300">|</span>
                <button className="text-gray-800 px-2" type="button">
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              className="mt-4 h-12 px-7 bg-[#dddddd] text-[14px] leading-none text-gray-700 rounded border border-gray-300"
              type="button">
              Search
            </button>

            <div className="mt-8 border-t border-gray-300 pt-6">
              {filteredKnowledgeArticles.length === 0 ? (
                <div className="text-[16px] text-gray-400 italic pl-1">
                  There are no articles matching your search
                </div>
              ) : (
                filteredKnowledgeArticles.map((article) => {
                  const isExpanded = expandedKnowledgeArticleId === article.id;
                  return (
                    <div
                      key={article.id}
                      className={`${isExpanded ? 'bg-[#f7f7f7] border border-gray-200 p-5' : ''} mb-4`}>
                      <button
                        onClick={() => setExpandedKnowledgeArticleId(isExpanded ? null : article.id)}
                        className="w-full flex items-center text-left text-gray-700"
                        type="button">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 mr-2 text-gray-500 shrink-0" />
                        )}
                        <span className="text-[18px] font-bold leading-none">{article.title}</span>
                      </button>

                      {isExpanded && (
                        <div className="mt-3 pl-9">
                          <p className="text-[14px] text-gray-400 leading-tight">
                            Categories: {article.categories}
                          </p>
                          <a
                            href="#"
                            className="inline-block mt-3 text-[14px] text-[#466480] underline"
                            onClick={(e) => e.preventDefault()}>
                            {article.linkText}
                          </a>
                          <div>
                            <button
                              type="button"
                              className="mt-4 h-11 px-4 bg-[#e5e5e5] border border-gray-300 rounded flex items-center text-[14px] leading-none text-gray-700">
                              <Send className="w-4 h-4 mr-2" />
                              Email Article
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>);

}
// ─── Prompts content by request type ─────────────────────────────────────────
const PROMPT_DATA: Record<string, { visibility: string; text: string; bullets?: string[] }> = {
  'City Drainage Project': {
    visibility: 'Public',
    text: 'To look up the current and future project list, please visit www.cityofpsl.com/government/projects-improvements.\n\nFor additional project information, please provide the following:',
    bullets: ['Location (intersection, road, etc.).'],
  },
  'Flooding': {
    visibility: 'Public',
    text: 'Please provide the following information to help us assess the drainage issue:',
    bullets: ['Location of standing water (address or intersection)', 'How long has the water been present?', 'Is it affecting roadway or private property?'],
  },
  'Blocked Swale – New Construction': {
    visibility: 'Public',
    text: 'Please provide details about the blocked swale:',
    bullets: ['Address of the construction site', 'Description of the blockage (dirt, debris, equipment)', 'Contractor name if known'],
  },
  'Overgrown Lot': {
    visibility: 'Public',
    text: '*DISCLAIMER* – Code Compliance can no longer receive anonymous complaints. Staff will need your name and your address along with the complaint information to investigate.',
    bullets: ['Address of the overgrown lot', 'How long has the lot been in this condition?', 'Is the vegetation encroaching on adjacent property?'],
  },
  'Abandoned Vehicle': {
    visibility: 'Public',
    text: 'Please provide the following to assist Code Compliance:',
    bullets: ['Vehicle make, model, and color', 'License plate number (if visible)', 'How long has the vehicle been at this location?'],
  },
  'Noise Complaint': {
    visibility: 'Public',
    text: 'Please provide details about the noise complaint:',
    bullets: ['Type of noise (music, construction, animals, etc.)', 'Time and frequency of occurrence', 'Address or location of the noise source'],
  },
  DEFAULT: {
    visibility: 'Public',
    text: 'Please provide as much detail as possible to help us address your request promptly.',
    bullets: ['Description of the issue', 'Location (address or intersection)', 'How long has this been occurring?'],
  },
};

function PromptContent({ requestType }: { requestType: string }) {
  const data = PROMPT_DATA[requestType] ?? PROMPT_DATA['DEFAULT'];
  const paragraphs = data.text.split('\n\n');
  return (
    <>
      <div className="inline-flex items-center text-green-600 font-bold text-sm mb-4">
        <Globe2 className="w-4 h-4 mr-1" /> {data.visibility}
      </div>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm text-gray-800 mb-3 leading-relaxed">{p}</p>
      ))}
      {data.bullets && (
        <ol className="list-decimal pl-5 text-sm text-gray-800 space-y-1 mt-1">
          {data.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ol>
      )}
    </>
  );
}

// ─── Where Section ───────────────────────────────────────────────────────────
const DEFAULT_CENTER = { lat: 27.2730, lon: -80.3582 };
const DEFAULT_ZOOM   = 13;

function buildOsmSrc(zoom: number, center: { lat: number; lon: number }, marker?: { lat: number; lon: number }) {
  const lonSpan = 0.22 * Math.pow(2, DEFAULT_ZOOM - zoom);
  const latSpan = 0.12 * Math.pow(2, DEFAULT_ZOOM - zoom);
  const w = (center.lon - lonSpan / 2).toFixed(5);
  const e = (center.lon + lonSpan / 2).toFixed(5);
  const s = (center.lat - latSpan / 2).toFixed(5);
  const n = (center.lat + latSpan / 2).toFixed(5);
  let url = `https://www.openstreetmap.org/export/embed.html?bbox=${w}%2C${s}%2C${e}%2C${n}&layer=mapnik`;
  if (marker) url += `&marker=${marker.lat.toFixed(5)}%2C${marker.lon.toFixed(5)}`;
  return url;
}

function WhereSection({
  activeTicketId,
  initialAddress,
  onAddressChange,
  residentFormData,
  showRequiredErrors = false,
}: {
  activeTicketId?: string | null;
  initialAddress?: string;
  onAddressChange?: (address: string) => void;
  residentFormData?: Partial<Submitter>;
  showRequiredErrors?: boolean;
}) {
  const [streetNum,   setStreetNum]   = useState('');
  const [streetName,  setStreetName]  = useState('');
  const [unitNum,     setUnitNum]     = useState('');
  const [crossStreet, setCrossStreet] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoom,        setZoom]        = useState(DEFAULT_ZOOM);
  const [center,      setCenter]      = useState(DEFAULT_CENTER);
  const [marker,      setMarker]      = useState<{ lat: number; lon: number } | undefined>();
  const [searching,   setSearching]   = useState(false);

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ', Port St. Lucie, FL')}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setCenter({ lat, lon });
        setMarker({ lat, lon });
        setZoom(17);
        // Parse display_name to fill fields
        const parts = (data[0].display_name as string).split(',');
        const streetPart = parts[0]?.trim() ?? '';
        const numMatch = streetPart.match(/^(\d+)\s+(.+)$/);
        if (numMatch) { setStreetNum(numMatch[1]); setStreetName(numMatch[2]); }
        else { setStreetName(streetPart); }
      }
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => {
    if (!initialAddress) return;
    const addressPart = initialAddress.split(',')[0]?.trim() ?? '';
    setSearchQuery(addressPart);
    const numMatch = addressPart.match(/^(\d+)\s+(.+)$/);
    if (numMatch) {
      setStreetNum(numMatch[1]);
      setStreetName(numMatch[2]);
    } else {
      setStreetNum('');
      setStreetName(addressPart);
    }
  }, [initialAddress]);

  const hasAddress = Boolean(streetNum.trim() && streetName.trim());

  useEffect(() => {
    const raw = `${streetNum} ${streetName}`.trim();
    onAddressChange?.(raw ? `${raw}, Port St. Lucie` : '');
  }, [streetNum, streetName, onAddressChange]);

  const useOption1WhereBehavior = true;
  if (useOption1WhereBehavior) {
    const addressMissing = !initialAddress?.trim() || initialAddress === 'N/A';
    return (
      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-[#1e2b3c] text-white px-4 py-2 flex justify-between items-center">
          <h3 className="font-bold text-sm">Where</h3>
          <button className="flex items-center text-xs hover:text-gray-300">
            <Settings className="w-3.5 h-3.5 mr-1" /> Options
          </button>
        </div>
        <WhereTab
          key={`where-tab-${activeTicketId ?? 'new'}-${initialAddress ?? ''}`}
          initialAddress={initialAddress}
          onAddressChange={onAddressChange}
          residentFormData={residentFormData}
        />
        {showRequiredErrors && addressMissing && (
          <div className="px-4 pb-3">
            {requiredMessage('Address is required')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-[#1e2b3c] text-white px-4 py-2 flex justify-between items-center">
        <h3 className="font-bold text-sm">Where</h3>
        <button className="flex items-center text-xs hover:text-gray-300">
          <Settings className="w-3.5 h-3.5 mr-1" /> Options
        </button>
      </div>

      <div className="p-4 flex gap-6">
        {/* Left: search + map */}
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <input
              type="text"
              placeholder="Search address"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 border border-gray-300 rounded-l px-3 py-1.5 text-sm outline-none focus:border-orange-400"
            />
            <button
              onClick={handleSearch}
              className="border border-l-0 border-gray-300 rounded-r px-2 py-1.5 bg-white hover:bg-gray-50">
              <MapPin className="w-4 h-4 text-orange-400" />
            </button>
          </div>

          {/* OSM iframe — extra height hides the OSM footer */}
          <div className="border border-gray-300 rounded h-64 relative overflow-hidden">
            {searching && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm text-gray-500">Searching…</div>
            )}
            <iframe
              key={buildOsmSrc(zoom, center, marker)}
              src={buildOsmSrc(zoom, center, marker)}
              title="Map"
              style={{ width: '100%', height: 'calc(100% + 32px)', border: 'none', pointerEvents: 'auto' }}
            />
          </div>
        </div>

        {/* Right: address fields */}
        <div className="w-64 space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">City</label>
            <div className="border border-gray-300 rounded px-2 py-1.5 flex justify-between items-center bg-gray-50 text-sm">
              <span>Port St. Lucie</span>
              <span className="text-xs text-gray-400">▼</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Street Number<span className="text-red-500">*</span></label>
            <input value={streetNum} onChange={e => setStreetNum(e.target.value)}
              className={`w-full border rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400 ${(showRequiredErrors && !streetNum.trim()) ? 'border-red-500' : 'border-gray-300'}`} />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Street Name<span className="text-red-500">*</span></label>
            <input value={streetName} onChange={e => setStreetName(e.target.value)}
              className={`w-full border rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400 ${(showRequiredErrors && !streetName.trim()) ? 'border-red-500' : 'border-gray-300'}`} />
            {showRequiredErrors && !hasAddress && requiredMessage('Address is required')}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Unit Number</label>
            <input value={unitNum} onChange={e => setUnitNum(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Cross Street</label>
            <input value={crossStreet} onChange={e => setCrossStreet(e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mock submitters for Who search ──────────────────────────────────────────
const MOCK_SUBMITTERS = [
  { id: '1', firstName: 'Jane', lastName: 'Doe', address: '133 SW Cameo Blvd', city: 'Port St. Lucie', email: 'jdoe.psl@gmail.com', phone: '772-555-0191' },
  { id: '2', firstName: 'Jane', lastName: 'Doe', address: '2814 SE Melaleuca Blvd', city: 'Port St. Lucie', email: 'jane.doe.2@outlook.com', phone: '772-555-0342' },
  { id: '3', firstName: 'Jane', lastName: 'Doe', address: '1892 SW Capehart Ave', city: 'Port St. Lucie', email: '', phone: '772-555-0587' },
  { id: '4', firstName: 'Jane', lastName: 'Smith', address: '450 NW Fork Rd', city: 'Port St. Lucie', email: 'jsmith.psl@yahoo.com', phone: '772-555-0214' },
  { id: '5', firstName: 'Jane', lastName: 'Miller', address: '7200 S US-1', city: 'Port St. Lucie', email: 'jane.miller@hotmail.com', phone: '772-555-0478' },
  { id: '6', firstName: 'John', lastName: 'Doe', address: '123 SW Cashmere Blvd', city: 'Port St. Lucie', email: 'j.doe.johnd@gmail.com', phone: '772-555-0033' },
  { id: '7', firstName: 'Mary', lastName: 'Doe', address: '980 SE Lennard Rd', city: 'Port St. Lucie', email: 'marydoe.florida@gmail.com', phone: '772-555-0712' },
  { id: '8', firstName: 'Robert', lastName: 'Johnson', address: '3401 SW Savona Blvd', city: 'Port St. Lucie', email: 'rjohnson.psl@gmail.com', phone: '772-555-0855' },
  { id: '9', firstName: 'Sarah', lastName: 'Williams', address: '1501 SW Cameo Blvd', city: 'Port St. Lucie', email: 's.williams.fl@outlook.com', phone: '772-555-0293' },
  { id: '10', firstName: 'Michael', lastName: 'Brown', address: '621 NW Lake Whitney Pl', city: 'Port St. Lucie', email: 'mbrown.psl@yahoo.com', phone: '772-555-0164' },
  { id: '11', firstName: 'Emily', lastName: 'Davis', address: '4576 SW Adamar Blvd', city: 'Port St. Lucie', email: 'emily.davis.fl@gmail.com', phone: '772-555-0921' },
  { id: '12', firstName: 'Carlos', lastName: 'Martinez', address: '882 SE Tidewater Cove', city: 'Port St. Lucie', email: 'cmartinez.psl@gmail.com', phone: '772-555-0647' },
];

type MockSubmitter = typeof MOCK_SUBMITTERS[0];

function WhoSection({
  onSubmitterIdChange,
  selectedSubmitterId,
  onWhoRequiredChange,
  showRequiredErrors = false,
}: {
  onSubmitterIdChange?: (submitterId: string | null) => void;
  selectedSubmitterId?: string | null;
  onWhoRequiredChange?: (data: { firstName: string; lastName: string; notifPrefMet: boolean }) => void;
  showRequiredErrors?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [selected, setSelected] = useState<MockSubmitter | null>(null);
  const [isEditingSelected, setIsEditingSelected] = useState(false);
  const [newForm, setNewForm] = useState({ firstName: '', lastName: '', mi: '', email: '', phone: '', phoneExt: '', altPhone: '', altPhoneExt: '', street: '', line2: '', city: 'Port St. Lucie', state: 'FL', zip: '', notifEmail: false, notifText: false, notifTextTo: 'Primary', notifCall: false, notifCallTo: 'Primary' });
  const wrapperRef = useRef<HTMLDivElement>(null);

  const q = query.toLowerCase().trim();
  const results = q.length > 0
    ? MOCK_SUBMITTERS.filter(s =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
        `${s.lastName} ${s.firstName}`.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.address.toLowerCase().includes(q)
      )
    : [];
  const showDropdown = focused && q.length > 0 && !addMode && !selected;
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function applySubmitter(s: MockSubmitter, emitChange: boolean) {
    setSelected(s);
    setQuery(`${s.lastName}, ${s.firstName}`);
    setNewForm({
      firstName: s.firstName,
      lastName: s.lastName,
      mi: '',
      email: s.email,
      phone: s.phone,
      phoneExt: '',
      altPhone: '',
      altPhoneExt: '',
      street: s.address,
      line2: '',
      city: s.city,
      state: 'FL',
      zip: '',
      notifEmail: false,
      notifText: false,
      notifTextTo: 'Primary',
      notifCall: false,
      notifCallTo: 'Primary'
    });
    setIsEditingSelected(false);
    setFocused(false);
    if (emitChange) onSubmitterIdChange?.(s.id);
  }

  function selectSubmitter(s: MockSubmitter) {
    applySubmitter(s, true);
  }

  function startAddNew() {
    setAddMode(true);
    setSelected(null);
    setIsEditingSelected(true);
    setFocused(false);
    // Pre-fill last name from search query
    setNewForm(f => ({ ...f, lastName: query }));
  }

  function remove(emitChange = true) {
    setSelected(null);
    setAddMode(false);
    setIsEditingSelected(false);
    setQuery('');
    setNewForm(f => ({ ...f, firstName: '', lastName: '', mi: '', email: '', phone: '', phoneExt: '', altPhone: '', altPhoneExt: '', street: '', line2: '', zip: '' }));
    if (emitChange) onSubmitterIdChange?.(null);
  }

  useEffect(() => {
    if (selectedSubmitterId) {
      const found = MOCK_SUBMITTERS.find(s => s.id === selectedSubmitterId);
      if (found) applySubmitter(found, false);
      return;
    }
    remove(false);
  }, [selectedSubmitterId]);

  const inp = "w-full border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default";
  const showSubmitterForm = addMode || !!selected;
  const readOnlyForm = !!selected && !addMode && !isEditingSelected;
  const firstNameValue = showSubmitterForm ? newForm.firstName : '';
  const lastNameValue = showSubmitterForm ? newForm.lastName : '';
  const notifPrefMet = showSubmitterForm ? (newForm.notifEmail || newForm.notifText || newForm.notifCall) : false;

  useEffect(() => {
    onWhoRequiredChange?.({
      firstName: firstNameValue.trim(),
      lastName: lastNameValue.trim(),
      notifPrefMet,
    });
  }, [firstNameValue, lastNameValue, notifPrefMet, onWhoRequiredChange]);

  return (
    <div className="bg-white rounded shadow-sm border border-gray-200">
      <div className="bg-[#1e2b3c] text-white px-4 py-2 flex justify-between items-center rounded-t">
        <h3 className="font-bold text-sm">Who</h3>
        <div className="flex items-center gap-4">
          {selected && !addMode && !isEditingSelected && (
            <button
              onClick={() => setIsEditingSelected(true)}
              className="text-white text-xs flex items-center hover:text-gray-300">
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </button>
          )}
          {(addMode || selected) && (
            <button onClick={() => remove()} className="text-white text-xs flex items-center hover:text-gray-300">
              <X className="w-3 h-3 mr-1" /> Remove
            </button>
          )}
        </div>
      </div>

      {/* Search state (not add mode, not selected) */}
      {!addMode && !selected && (
        <div className="p-4 min-h-[430px] flex flex-col" ref={wrapperRef}>
          <label className="block text-sm text-gray-700 mb-1">Find Submitter</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder="Enter name, email or phone"
              className={`w-full border rounded pl-9 pr-3 py-1.5 text-sm outline-none ${focused ? 'border-orange-400' : 'border-gray-300'}`}
            />
            {showDropdown && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 shadow-lg z-20 rounded-b">
                {results.map(s => {
                  const detail = [s.address && `${s.address}, ${s.city}`, s.email, s.phone].filter(Boolean).join(', ');
                  return (
                    <div
                      key={s.id}
                      onClick={() => selectSubmitter(s)}
                      className="flex items-baseline px-4 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-blue-100 last:border-0"
                    >
                      <span className="w-48 shrink-0 text-sm text-gray-800">{s.lastName}, {s.firstName}</span>
                      <span className="text-sm text-gray-600 truncate">{detail}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-start gap-2 pt-5 pb-2">
            <span className="text-xs text-gray-400">or</span>
            <button
              onClick={startAddNew}
              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-600 px-3 py-1 rounded flex items-center text-sm font-normal">
              <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.2} /> Add a new submitter
            </button>
          </div>
          {showRequiredErrors && requiredMessage('First name, last name, and notification preference are required')}
        </div>
      )}

      {/* Add / Selected Submitter form */}
      {showSubmitterForm && (
        <div className="p-6">
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            {/* Left: Name + Address */}
            <div className="space-y-4">
              <div className="font-bold text-gray-800 text-sm">Name</div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">First<span className="text-red-500">*</span></label>
                <input autoFocus={addMode || isEditingSelected} disabled={readOnlyForm} value={newForm.firstName} onChange={e => setNewForm(f => ({...f, firstName: e.target.value}))} className={`${inp} ${(showRequiredErrors && !newForm.firstName.trim()) ? '!border-red-500' : ''}`} />
                {showRequiredErrors && !newForm.firstName.trim() && requiredMessage('First name is required')}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Last<span className="text-red-500">*</span></label>
                <input disabled={readOnlyForm} value={newForm.lastName} onChange={e => setNewForm(f => ({...f, lastName: e.target.value}))} className={`${inp} ${(showRequiredErrors && !newForm.lastName.trim()) ? '!border-red-500' : ''}`} />
                {showRequiredErrors && !newForm.lastName.trim() && requiredMessage('Last name is required')}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Middle Initial</label>
                <input disabled={readOnlyForm} value={newForm.mi} onChange={e => setNewForm(f => ({...f, mi: e.target.value}))} className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default" maxLength={1} />
              </div>

              <div className="font-bold text-gray-800 text-sm pt-2">Address</div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Street Number and Name</label>
                <input disabled={readOnlyForm} value={newForm.street} onChange={e => setNewForm(f => ({...f, street: e.target.value}))} className={inp} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Line 2</label>
                <input disabled={readOnlyForm} value={newForm.line2} onChange={e => setNewForm(f => ({...f, line2: e.target.value}))} className={inp} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">City / State / Postal Code</label>
                <div className="flex gap-2">
                  <input disabled={readOnlyForm} value={newForm.city} onChange={e => setNewForm(f => ({...f, city: e.target.value}))} className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default" />
                  <select disabled={readOnlyForm} value={newForm.state} onChange={e => setNewForm(f => ({...f, state: e.target.value}))} className="w-16 border border-gray-300 rounded px-1 py-1.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default">
                    <option>FL</option><option>GA</option><option>NY</option><option>CA</option><option>TX</option>
                  </select>
                  <input disabled={readOnlyForm} value={newForm.zip} onChange={e => setNewForm(f => ({...f, zip: e.target.value}))} className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default" placeholder="ZIP" />
                </div>
              </div>
            </div>

            {/* Right: Contact + Notification Prefs */}
            <div className="space-y-4">
              <div className="font-bold text-gray-800 text-sm">Contact</div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm text-gray-600">Email Address</label>
                  {selected && !addMode && (
                    <button type="button" className="text-sm text-[#456a7f] hover:underline">
                      Reset Password
                    </button>
                  )}
                </div>
                <input disabled={readOnlyForm} value={newForm.email} onChange={e => setNewForm(f => ({...f, email: e.target.value}))} className={inp} />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone / Extension</label>
                <div className="flex gap-2">
                  <input disabled={readOnlyForm} value={newForm.phone} onChange={e => setNewForm(f => ({...f, phone: e.target.value}))} className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default" />
                  <input disabled={readOnlyForm} value={newForm.phoneExt} onChange={e => setNewForm(f => ({...f, phoneExt: e.target.value}))} className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default" placeholder="Ext" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Alternate Phone / Extension</label>
                <div className="flex gap-2">
                  <input disabled={readOnlyForm} value={newForm.altPhone} onChange={e => setNewForm(f => ({...f, altPhone: e.target.value}))} className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default" />
                  <input disabled={readOnlyForm} value={newForm.altPhoneExt} onChange={e => setNewForm(f => ({...f, altPhoneExt: e.target.value}))} className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm outline-none focus:border-orange-400 disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default" placeholder="Ext" />
                </div>
              </div>

              <div className="font-bold text-gray-800 text-sm pt-2">Notification Preferences<span className="text-red-500">*</span></div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input disabled={readOnlyForm} type="checkbox" checked={newForm.notifEmail} onChange={e => setNewForm(f => ({...f, notifEmail: e.target.checked}))} className="w-4 h-4" />
                Email
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input disabled={readOnlyForm} type="checkbox" checked={newForm.notifText} onChange={e => setNewForm(f => ({...f, notifText: e.target.checked}))} className="w-4 h-4" />
                Text Message to
                <select disabled={readOnlyForm} value={newForm.notifTextTo} onChange={e => setNewForm(f => ({...f, notifTextTo: e.target.value}))} className="border border-gray-300 rounded px-2 py-0.5 text-sm outline-none disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default">
                  <option>Primary</option><option>Alternate</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input disabled={readOnlyForm} type="checkbox" checked={newForm.notifCall} onChange={e => setNewForm(f => ({...f, notifCall: e.target.checked}))} className="w-4 h-4" />
                Phone Call to
                <select disabled={readOnlyForm} value={newForm.notifCallTo} onChange={e => setNewForm(f => ({...f, notifCallTo: e.target.value}))} className="border border-gray-300 rounded px-2 py-0.5 text-sm outline-none disabled:bg-[#f8f8f8] disabled:text-gray-600 disabled:cursor-default">
                  <option>Primary</option><option>Alternate</option>
                </select>
              </label>
              {showRequiredErrors && !notifPrefMet && requiredMessage('At least one notification preference is required')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
