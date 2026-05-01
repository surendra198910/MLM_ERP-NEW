import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { ApiService } from "../../../../services/ApiService";
import { useSweetAlert } from "../../context/SweetAlertContext";
import SpinnerLoader from "../../../../components/UIElements/Spinner/DefaultSpinner";

// --- Types ---
type Category = {
  FormCategoryId: number;
  FormCategoryName: string;
  ParentCategoryName: string | null;
  TotalTemplates: number;
  Icon?: string;
  IsActive?: boolean;
};

type EmailTemplate = {
  EmailTemplateId: number;
  TemplateName: string;
  Type: string;
  Status: string;
  Subject?: string;
  EmailContent?: string;
};

const ManageEmailTemplates: React.FC = () => {
  const { universalService } = ApiService();
  const swal = useSweetAlert();
  
  const ShowSuccessAlert = swal?.ShowSuccessAlert || ((msg: string) => alert(msg));
  const ShowErrorAlert = swal?.ShowErrorAlert || ((msg: string) => alert(msg));
  const [previewMode, setPreviewMode] = useState(false);
  
  // --- State ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [companyId, setCompanyId] = useState<number>(1);
  
  // Editor States
  const [editorContent, setEditorContent] = useState("");
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [htmlMode, setHtmlMode] = useState(false);
  
  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    TemplateName: "",
    Type: "Public",
    Subject: "",
    EmailContent: "",
    Status: "Active",
  });

  // --- Image Resize Functionality ---
 const makeImageResizable = useCallback((img: HTMLImageElement) => {
  if (!img || img.dataset.resizable === "true") return;

  img.dataset.resizable = "true";
  img.style.maxWidth = "100%";
  img.style.cursor = "pointer";

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.display = "inline-block";

  img.parentNode?.insertBefore(wrapper, img);
  wrapper.appendChild(img);

  const handle = document.createElement("div");
  handle.style.width = "12px";
  handle.style.height = "12px";
  handle.style.background = "#3b82f6";
  handle.style.position = "absolute";
  handle.style.right = "-6px";
  handle.style.bottom = "-6px";
  handle.style.cursor = "se-resize";

  wrapper.appendChild(handle);

  let startX = 0;
  let startWidth = 0;

  handle.onmousedown = (e) => {
    e.preventDefault();
    startX = e.clientX;
    startWidth = img.offsetWidth;

    const onMove = (ev: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (ev.clientX - startX));
      img.style.width = newWidth + "px";
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };
}, []);


  // Apply image resizing to all images in editor
  const applyImageResizing = useCallback(() => {
    if (!editorRef.current) return;
    const images = editorRef.current.querySelectorAll('img');
    images.forEach((img: HTMLImageElement) => {
      makeImageResizable(img);
    });
  }, [makeImageResizable]);

  // Watch for new images
  useEffect(() => {
    if (!editorRef.current || !showModal) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IMG') {
            makeImageResizable(node as HTMLImageElement);
          }
        });
      });
    });
    
    observer.observe(editorRef.current, { childList: true, subtree: true });
    setTimeout(() => applyImageResizing(), 100);
    
    return () => observer.disconnect();
  }, [showModal, editorContent, makeImageResizable, applyImageResizing]);

  // --- Editor Formatting Functions ---
  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value || '');
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setEditorContent(content);
      setFormData(prev => ({ ...prev, EmailContent: content }));
    }
  };


  ///----------

  useEffect(() => {
  if (!htmlMode && editorRef.current) {
    editorRef.current.innerHTML = editorContent;
  }
}, [htmlMode]);


  useEffect(() => {
  const handleClick = (e: any) => {
    if (e.target.tagName === 'IMG') {
      setSelectedImage(e.target);
    } else {
      setSelectedImage(null);
    }
  };

  const editor = editorRef.current;

  editor?.addEventListener('click', handleClick);

  return () => {
    editor?.removeEventListener('click', handleClick);
  };
}, []);

const alignImage = (align: 'left' | 'center' | 'right') => {
  if (!selectedImage) return;

  if (align === 'left') {
    selectedImage.style.display = 'block';
    selectedImage.style.margin = '10px auto 10px 0';
  }

  if (align === 'center') {
    selectedImage.style.display = 'block';
    selectedImage.style.margin = '10px auto';
  }

  if (align === 'right') {
    selectedImage.style.display = 'block';
    selectedImage.style.margin = '10px 0 10px auto';
  }

  updateContent();
};

  ///---------------------



  const handleFontSize = (size: string) => {
    editorRef.current?.focus();
    const sizeMap: { [key: string]: string } = {
      '1': '10px',
      '2': '13px', 
      '3': '16px',
      '4': '18px',
      '5': '24px',
      '6': '32px',
      '7': '48px'
    };
    document.execCommand('fontSize', false, size);
    // Fix for font size
    const fontElements = editorRef.current?.querySelectorAll('font');
    fontElements?.forEach(el => {
      if (el.hasAttribute('size')) {
        const sizeValue = el.getAttribute('size');
        if (sizeValue && sizeMap[sizeValue]) {
          el.style.fontSize = sizeMap[sizeValue];
          el.removeAttribute('size');
        }
      }
    });
    updateContent();
  };

  const handleTextColor = (color: string) => {
    execCommand('foreColor', color);
  };

  const handleBackgroundColor = (color: string) => {
    execCommand('backColor', color);
  };

  const handleTextAlign = (align: string) => {
    execCommand('justify' + align.charAt(0).toUpperCase() + align.slice(1));
  };

  const handleInsertImage = () => {
    setShowImageUrlModal(true);
  };

  // const insertImageFromUrl = () => {
  //   if (imageUrl && imageUrl.trim()) {
  //     const img = document.createElement('img');
  //     img.src = imageUrl;
  //     img.style.maxWidth = '100%';
  //     img.style.height = 'auto';
  //     img.style.display = 'block';
  //     img.style.margin = '10px 0';
      
  //     // Insert at cursor position or at the end
  //     const selection = window.getSelection();
  //     if (selection && selection.rangeCount > 0 && selection.getRangeAt(0).collapsed) {
  //       const range = selection.getRangeAt(0);
  //       range.insertNode(img);
  //       range.collapse(false);
  //     } else {
  //       editorRef.current?.appendChild(img);
  //     }
      
  //     makeImageResizable(img);
  //     updateContent();
  //     setImageUrl("");
  //     setShowImageUrlModal(false);
  //   }
  // };
const insertImageFromUrl = () => {
  if (!imageUrl.trim()) return;

  const imgHTML = `<img src="${imageUrl}" style="max-width:100%;height:auto;display:block;margin:10px 0;" />`;

  editorRef.current?.focus();

  document.execCommand("insertHTML", false, imgHTML);

  updateContent(); // now state WILL have <img>

  setImageUrl("");
  setShowImageUrlModal(false);
};


  const handleLocalImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        ShowErrorAlert("Image size should be less than 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        ShowErrorAlert("Please select a valid image file");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target?.result as string;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '10px 0';
        
        editorRef.current?.appendChild(img);
        makeImageResizable(img);
        updateContent();
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleInsertLink = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";
    
    if (selectedText) {
      setLinkText(selectedText);
      setShowLinkModal(true);
    } else {
      ShowErrorAlert("Please select text to create a link");
    }
  };

  const insertLink = () => {
    if (linkUrl && linkUrl.trim()) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        const link = document.createElement('a');
        link.href = linkUrl;
        link.target = '_blank';
        link.textContent = linkText || selectedText || linkUrl;
        link.style.color = '#3b82f6';
        link.style.textDecoration = 'underline';
        
        range.deleteContents();
        range.insertNode(link);
        range.collapse(false);
        updateContent();
      }
      setLinkUrl("");
      setLinkText("");
      setShowLinkModal(false);
    }
  };

  // --- Load Categories ---
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await universalService({
        procName: "Email",
        Para: JSON.stringify({ ActionMode: "Categories" }),
      });
      const data = res?.data ?? res;
      if (Array.isArray(data)) {
        setCategories(data);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
      ShowErrorAlert("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadTemplates = async (category: Category) => {
    setSelectedCategory(category);
    setTemplates([]);
    setLoadingTemplates(true);
    
    try {
      const res = await universalService({
        procName: "Email",
        Para: JSON.stringify({
          ActionMode: "EMailTemplates",
          FormCategoryId: category.FormCategoryId,
          CompanyId: companyId
        }),
      });
      const data = res?.data ?? res;
      if (Array.isArray(data)) {
        setTemplates(data);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
      ShowErrorAlert("Failed to load templates");
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.TemplateName.trim()) {
      ShowErrorAlert("Template name is required");
      return;
    }

    if (!formData.Subject.trim()) {
      ShowErrorAlert("Email subject is required");
      return;
    }

    setSaving(true);
    try {
      const actionMode = modalMode === "add" ? "Insert" : "Update";
      const payload: any = {
        ActionMode: actionMode,
        TemplateName: formData.TemplateName,
        Type: formData.Type,
        Subject: formData.Subject,
        EmailContent: encodeURIComponent(editorContent),
      //  EmailContent: editorContent, 
        FormCategoryId: selectedCategory?.FormCategoryId,
        Status: formData.Status,
        CompanyId: companyId,
        EntryBy: 1,
      };

      if (modalMode === "edit" && selectedTemplate) {
        payload.EditId = selectedTemplate.EmailTemplateId;
      }

      const res = await universalService({
        procName: "Email",
        Para: JSON.stringify(payload),
      });

      const data = res?.data ?? res;
      if (data && (data[0]?.statuscode === "1" || data[0]?.statuscode === "2")) {
        ShowSuccessAlert(data[0]?.msg || "Template saved successfully");
        handleCloseModal();
        if (selectedCategory) {
          loadTemplates(selectedCategory);
        }
      } else {
        ShowErrorAlert(data[0]?.msg || "Failed to save template");
      }
    } catch (err) {
      console.error("Error saving template:", err);
      ShowErrorAlert("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete "${template.TemplateName}"?`);
    
    if (isConfirmed) {
      try {
        const res = await universalService({
          procName: "Email",
          Para: JSON.stringify({
            ActionMode: "Delete",
            EditId: template.EmailTemplateId,
            EntryBy: 1,
          }),
        });
        
        const data = res?.data ?? res;
        if (data && data[0]?.statuscode === "2") {
          ShowSuccessAlert("Template deleted successfully");
          if (selectedCategory) {
            loadTemplates(selectedCategory);
          }
        } else {
          ShowErrorAlert("Failed to delete template");
        }
      } catch (err) {
        console.error("Error deleting template:", err);
        ShowErrorAlert("An error occurred while deleting");
      }
    }
  };

  const handleStatusChange = async (template: EmailTemplate, newStatus: string) => {
    try {
      const res = await universalService({
        procName: "Email",
        Para: JSON.stringify({
          ActionMode: "ChangeStatus",
          EditId: template.EmailTemplateId,
          Status: newStatus,
          EntryBy: 1,
        }),
      });
      
      const data = res?.data ?? res;
      if (data && data[0]?.statuscode === "2") {
        ShowSuccessAlert(`Template ${newStatus.toLowerCase()} successfully`);
        if (selectedCategory) {
          loadTemplates(selectedCategory);
        }
      } else {
        ShowErrorAlert("Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      ShowErrorAlert("An error occurred while updating status");
    }
  };

  const handleEditTemplate = async (template: EmailTemplate) => {
    try {
      const res = await universalService({
        procName: "Email",
        Para: JSON.stringify({
          ActionMode: "Select",
          EditId: template.EmailTemplateId,
        }),
      });
      
      const data = res?.data ?? res;
      if (Array.isArray(data) && data.length > 0) {
        const templateData = data[0];
        setFormData({
          TemplateName: templateData.TemplateName || "",
          Type: templateData.Type || "Public",
          Subject: templateData.Subject || "",
          EmailContent: templateData.EmailContent || "",
          Status: templateData.Status || "Active",
        });
//       setEditorContent(
//   templateData.EmailContent
//     ? decodeURIComponent(templateData.EmailContent)
//     : ""
// );
setEditorContent(templateData.EmailContent || "");
        setSelectedTemplate(template);
        setModalMode("edit");
        setShowModal(true);
      }
    } catch (err) {
      console.error("Error loading template details:", err);
      ShowErrorAlert("Failed to load template details");
    }
  };

  const handleAddNewTemplate = () => {
    setFormData({
      TemplateName: "",
      Type: "Public",
      Subject: "",
      EmailContent: "",
      Status: "Active",
    });
    setEditorContent("");
    setSelectedTemplate(null);
    setModalMode("add");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTemplate(null);
    setFormData({
      TemplateName: "",
      Type: "Public",
      Subject: "",
      EmailContent: "",
      Status: "Active",
    });
    setEditorContent("");
    setShowImageUrlModal(false);
    setShowLinkModal(false);
    setImageUrl("");
    setLinkUrl("");
    setLinkText("");
  };

  // Insert tag into editor
  const insertTag = (tag: string) => {
    editorRef.current?.focus();
    const text = tag;
    document.execCommand('insertText', false, text);
    updateContent();
  };

  // --- Filter Categories ---
  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.FormCategoryName.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  // --- Group Categories by Parent ---
  const groupedCategories = useMemo(() => {
    const groups: Record<string, Category[]> = {};
    filteredCategories.forEach((cat) => {
      const parent = cat.ParentCategoryName || "General";
      if (!groups[parent]) groups[parent] = [];
      groups[parent].push(cat);
    });
    return groups;
  }, [filteredCategories]);

  // Focus editor and set cursor position
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  };
  useEffect(() => {
  if (showModal && editorRef.current) {
    editorRef.current.innerHTML = editorContent;
  }
}, [showModal]);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h4 className="text-xl font-bold text-gray-900 dark:text-white">E-Mail Templates</h4>
      </div>

      {/* Main Layout */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row h-auto lg:h-[700px]">
          
          {/* Left Sidebar - Categories */}
          <div className="w-full lg:w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder="Search Category..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingCategories ? (
                <div className="flex justify-center p-8"><SpinnerLoader /></div>
              ) : (
                Object.entries(groupedCategories).map(([parent, subs]) => (
                  <div key={parent}>
                    {parent && parent !== "null" && parent !== "General" && (
                      <div className="px-4 py-2 text-xs font-bold text-primary-600 dark:text-primary-400 bg-gray-100 dark:bg-gray-800 uppercase">
                        {parent}
                      </div>
                    )}
                    {subs.map((cat) => (
                      <div
                        key={cat.FormCategoryId}
                        onClick={() => loadTemplates(cat)}
                        className={`flex items-center p-3 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
                          selectedCategory?.FormCategoryId === cat.FormCategoryId
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                            : ''
                        }`}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <i className="material-symbols-outlined text-gray-500">email</i>
                        </div>
                        <div className="flex-1 ml-3">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{cat.FormCategoryName}</div>
                          <div className="text-xs text-gray-500">Total Templates: {cat.TotalTemplates}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Content - Templates */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="text-gray-600 dark:text-gray-400">
                Showing Email Templates of category - {selectedCategory?.FormCategoryName || 'Select a category'}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!selectedCategory ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <i className="material-symbols-outlined text-6xl text-gray-300 mb-4">mail_outline</i>
                  <div className="text-lg text-gray-500">Select a Template Category</div>
                  <div className="text-sm text-gray-400 mt-2">Choose a category from the left sidebar</div>
                </div>
              ) : loadingTemplates ? (
                <div className="flex justify-center p-8"><SpinnerLoader /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Add New Template Card */}
                  <div
                    onClick={handleAddNewTemplate}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                  >
                    <i className="material-symbols-outlined text-4xl text-gray-400 mb-2">add_circle</i>
                    <div className="text-gray-600 dark:text-gray-400">Add New Template</div>
                  </div>

                  {/* Existing Templates */}
                  {templates.map((template) => (
                    <div key={template.EmailTemplateId} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-gray-800">
                      <div className="p-4">
                        <div className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">{template.TemplateName}</div>
                        <div className="flex items-center justify-between mb-3">
                          <span 
                            onClick={() => handleStatusChange(template, template.Status === 'Active' ? 'Inactive' : 'Active')}
                            className={`px-2 py-1 text-xs rounded-full cursor-pointer ${
                              template.Status === 'Active' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {template.Status} ({template.Type})
                          </span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="flex-1 px-3 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-1"
                          >
                            <i className="material-symbols-outlined text-sm">edit</i> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template)}
                            className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                          >
                            <i className="material-symbols-outlined text-sm">delete</i> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Template Editor Modal */}
      {showModal && (
     <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">

    {/* Header */}
    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
        {modalMode === "add" ? "Create Email Template" : "Edit Email Template"}
      </h4>
      <button onClick={handleCloseModal} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
        <i className="material-symbols-outlined">close</i>
      </button>
    </div>

    {/* Body */}
    <div className="flex-1 overflow-y-auto px-6 py-5">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* LEFT */}
        <div className="lg:col-span-3 space-y-5">

          {/* Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Template Name *</label>
              <input
                type="text"
                value={formData.TemplateName}
                onChange={(e) => setFormData({ ...formData, TemplateName: e.target.value })}
                className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Template Type</label>
              <select
                value={formData.Type}
                onChange={(e) => setFormData({ ...formData, Type: e.target.value })}
                className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Email Subject *</label>
            <input
              type="text"
              value={formData.Subject}
              onChange={(e) => setFormData({ ...formData, Subject: e.target.value })}
              className="w-full h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>

          {/* Editor Section */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Email Content</label>

            {/* Toolbar stays SAME (your improved one) */}
            

            {/* Add wrapper for editor */}
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm">

              {/* YOUR TOOLBAR HERE (UNCHANGED) */}
              {/* Editor Toolbar */}

<div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 px-2 py-1 
bg-white dark:bg-gray-900 
border border-gray-300 dark:border-gray-700 
rounded-t-md shadow-sm">

  {/* HTML Toggle */}
  <button
    type="button"
    onClick={() => setHtmlMode(!htmlMode)}
    className="h-8 px-2 text-sm font-mono 
    bg-gray-100 dark:bg-gray-800 
    border border-gray-300 dark:border-gray-600 
    rounded-md 
    hover:bg-gray-200 dark:hover:bg-gray-700"
  >
    {htmlMode ? "</>" : "</>"}
  </button>

  {/* Bold */}
  <button type="button" onClick={() => execCommand('bold')}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Bold">
    <i className="material-symbols-outlined text-[18px] leading-none">format_bold</i>
  </button>

  {/* Italic */}
  <button type="button" onClick={() => execCommand('italic')}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Italic">
    <i className="material-symbols-outlined text-[18px] leading-none">format_italic</i>
  </button>

  {/* Underline */}
  <button type="button" onClick={() => execCommand('underline')}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Underline">
    <i className="material-symbols-outlined text-[18px] leading-none">format_underlined</i>
  </button>

  <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>

  {/* Align Left */}
  <button type="button" onClick={() => handleTextAlign('left')}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Align Left">
    <i className="material-symbols-outlined text-[18px] leading-none">format_align_left</i>
  </button>

  {/* Align Center */}
  <button type="button" onClick={() => handleTextAlign('center')}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Align Center">
    <i className="material-symbols-outlined text-[18px] leading-none">format_align_center</i>
  </button>

  {/* Align Right */}
  <button type="button" onClick={() => handleTextAlign('right')}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Align Right">
    <i className="material-symbols-outlined text-[18px] leading-none">format_align_right</i>
  </button>

  <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>

  {/* Bullet List */}
  <button type="button" onClick={() => execCommand('insertUnorderedList')}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Bullet List">
    <i className="material-symbols-outlined text-[18px] leading-none">format_list_bulleted</i>
  </button>

  {/* Numbered List */}
  <button type="button" onClick={() => execCommand('insertOrderedList')}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Numbered List">
    <i className="material-symbols-outlined text-[18px] leading-none">format_list_numbered</i>
  </button>

  <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>

  {/* Font Size */}
  <select
    onChange={(e) => handleFontSize(e.target.value)}
    className="h-8 text-sm px-2 
    border border-gray-300 dark:border-gray-600 
    rounded-md 
    bg-white dark:bg-gray-800 
    focus:outline-none">
    <option value="3">Normal</option>
    <option value="1">Small</option>
    <option value="4">Large</option>
    <option value="5">Huge</option>
    <option value="6">Very Large</option>
    <option value="7">Maximum</option>
  </select>

  {/* Text Color */}
  <input
    type="color"
    onChange={(e) => handleTextColor(e.target.value)}
    className="h-8 w-8 p-0 border border-gray-300 dark:border-gray-600 
    rounded-md cursor-pointer overflow-hidden"
    title="Text Color"
  />

  {/* Background Color */}
  <input
    type="color"
    onChange={(e) => handleBackgroundColor(e.target.value)}
    className="h-8 w-8 p-0 border border-gray-300 dark:border-gray-600 
    rounded-md cursor-pointer overflow-hidden"
    title="Background Color"
  />

  <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>

  {/* Insert Link */}
  <button type="button" onClick={handleInsertLink}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Insert Link">
    <i className="material-symbols-outlined text-[18px] leading-none">link</i>
  </button>

  {/* Insert Image URL */}
  <button type="button" onClick={handleInsertImage}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Insert Image URL">
    <i className="material-symbols-outlined text-[18px] leading-none">image</i>
  </button>

  {/* Upload Image */}
  <input
    type="file"
    ref={fileInputRef}
    onChange={handleLocalImageUpload}
    accept="image/*"
    className="hidden"
  />
  <button
    type="button"
    onClick={() => fileInputRef.current?.click()}
    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    title="Upload Image">
    <i className="material-symbols-outlined text-[18px] leading-none">upload_file</i>
  </button>

</div>

              {/* Preview Toggle */}
              <div className="flex justify-end px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="text-xs px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300"
                >
                  {previewMode ? "Edit Mode" : "Preview Mode"}
                </button>
              </div>

              {/* Editor Area */}
              <div className="p-4">
                {htmlMode ? (
                  <textarea
                    value={editorContent}
                    onChange={(e) => {
                      setEditorContent(e.target.value);
                      setFormData(prev => ({ ...prev, EmailContent: e.target.value }));
                    }}
                    className="w-full min-h-[400px] font-mono text-sm bg-black text-green-400 p-4 rounded-md"
                  />
                ) : previewMode ? (
                  <div
                    className="min-h-[400px]"
                    dangerouslySetInnerHTML={{ __html: editorContent }}
                  />
                ) : (
                  <div
                    ref={editorRef}
                    contentEditable
                    dir="ltr"
                    onInput={updateContent}
                    className="min-h-[400px] focus:outline-none"
                  />
                )}
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Click image to resize. Drag corners. Click outside to exit resize.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="lg:col-span-1">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 sticky top-0">

            <div className="flex items-center gap-2 mb-3">
              <i className="material-symbols-outlined text-sm">sell</i>
              <span className="text-sm font-semibold">Select TAG Master</span>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              Click to insert at cursor position
            </p>

            <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
              {['FNAME','LNAME','EMAIL','COMPANY','MOBILE','DATE','ADDRESS','CITY','STATE','COUNTRY','WEBSITE','ORDER_ID'].map(tag => (
                <button
                  key={tag}
                  onClick={() => insertTag(`{${tag}}`)}
                  className="px-3 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-primary-500 hover:text-white transition"
                >
                  {`{${tag}}`}
                </button>
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>

    {/* Footer */}
    <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <button
        onClick={handleCloseModal}
        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        Cancel
      </button>

      <button
        onClick={handleSaveTemplate}
        disabled={saving}
        className="px-4 py-2 text-sm bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
      >
        {saving ? <SpinnerLoader /> : <i className="material-symbols-outlined text-sm">save</i>}
        {modalMode === "add" ? "Add Template" : "Update Template"}
      </button>
    </div>

  </div>
</div>
      )}

      {/* Image URL Modal */}
      {showImageUrlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insert Image from URL</h3>
                <button onClick={() => setShowImageUrlModal(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="material-symbols-outlined">close</i>
                </button>
              </div>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
                autoFocus
              />
              {imageUrl && (
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                  <img src={imageUrl} alt="Preview" className="max-w-full h-auto max-h-32 rounded" />
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowImageUrlModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button onClick={insertImageFromUrl} className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                  Insert Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insert Link</h3>
                <button onClick={() => setShowLinkModal(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="material-symbols-outlined">close</i>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Link Text</label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Text to display"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowLinkModal(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button onClick={insertLink} className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .image-wrapper {
          position: relative;
          display: block;
          width: fit-content;
          max-width: 100%;
          margin: 10px 0;
        }
        
        .image-wrapper img {
          display: block;
          max-width: 100%;
          height: auto;
        }
        
        .resize-handle {
          position: absolute;
          width: 12px;
          height: 12px;
          background-color: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          z-index: 100;
          transition: transform 0.1s ease;
        }
        
        .resize-handle:hover {
          transform: scale(1.3);
          background-color: #2563eb;
        }
        
        .resize-handle-nw {
          top: -6px;
          left: -6px;
          cursor: nw-resize;
        }
        
        .resize-handle-ne {
          top: -6px;
          right: -6px;
          cursor: ne-resize;
        }
        
        .resize-handle-sw {
          bottom: -6px;
          left: -6px;
          cursor: sw-resize;
        }
        
        .resize-handle-se {
          bottom: -6px;
          right: -6px;
          cursor: se-resize;
        }
        
        [contenteditable="true"] {
          outline: none;
          cursor: text;
        }
        
        [contenteditable="true"]:focus {
          outline: none;
        }
        
        [contenteditable="true"] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contenteditable="true"] img {
          max-width: 100%;
          height: auto;
          cursor: pointer;
        }
        
        [contenteditable="true"] p {
          margin: 0 0 10px 0;
        }
        
        [contenteditable="true"] div {
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default ManageEmailTemplates;