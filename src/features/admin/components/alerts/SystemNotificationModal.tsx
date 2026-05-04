"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { useEditor } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { sendSystemNotification } from '@/services/chat/chatService';
import { userManagementService } from '@/services/admin/userManagementService';
import type { UserManagementListItem } from '@/types/userManagement';
import SystemNotificationEditor from '@/features/admin/components/alerts/SystemNotificationEditor';
import { LinkMark, TextStyleMark, UnderlineMark } from '@/features/admin/components/alerts/editorExtensions';

interface SystemNotificationModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_MESSAGE_LENGTH = 4000;
const USER_PAGE_SIZE = 10;

export default function SystemNotificationModal({
  isOpen,
  onOpenChange,
}: SystemNotificationModalProps) {
  const [sendToAll, setSendToAll] = useState(false);
  const [users, setUsers] = useState<UserManagementListItem[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingMoreUsers, setIsLoadingMoreUsers] = useState(false);
  const [userPageIndex, setUserPageIndex] = useState(1);
  const [hasNextUsersPage, setHasNextUsersPage] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editorContent, setEditorContent] = useState({ html: "", text: "" });
  const [selectorPlacement, setSelectorPlacement] = useState<"top" | "bottom">("bottom");
  const [selectorMaxHeight, setSelectorMaxHeight] = useState(224);
  const selectorTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectorDropdownRef = useRef<HTMLDivElement | null>(null);

  const loadUsers = useCallback(
    async (pageIndex: number, append: boolean) => {
      try {
        if (append) {
          setIsLoadingMoreUsers(true);
        } else {
          setIsLoadingUsers(true);
        }

        setUsersError(null);

        const paginated = await userManagementService.getUsers({
          pageIndex,
          pageSize: USER_PAGE_SIZE,
          search: searchKeyword || undefined,
        });

        const nextItems = paginated.items ?? [];

        setUsers((previous) => {
          if (!append) {
            return nextItems;
          }

          const existed = new Set(previous.map((user) => user.id));
          const merged = [...previous];

          for (const item of nextItems) {
            if (!existed.has(item.id)) {
              merged.push(item);
            }
          }

          return merged;
        });

        setUserPageIndex(pageIndex);
        setHasNextUsersPage(Boolean(paginated.hasNextPage));
      } catch (error) {
        if (!append) {
          setUsers([]);
        }

        setUsersError(
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách người dùng'
        );
      } finally {
        setIsLoadingUsers(false);
        setIsLoadingMoreUsers(false);
      }
    },
    [searchKeyword]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      UnderlineMark,
      TextStyleMark,
      LinkMark,
      Placeholder.configure({
        placeholder: 'Nhập nội dung thông báo hệ thống...',
      }),
    ],
    editorProps: {
      attributes: {
        class:
          'min-h-[180px] max-h-[260px] overflow-y-auto rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 [&_a]:text-blue-600 dark:[&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:font-semibold [&_em]:italic [&_u]:underline break-all',
      },
    },
    content: '',
    onCreate({ editor: currentEditor }) {
      setEditorContent({
        html: currentEditor.getHTML(),
        text: currentEditor.getText().trim(),
      });
    },
    onUpdate({ editor: currentEditor }) {
      setEditorContent({
        html: currentEditor.getHTML(),
        text: currentEditor.getText().trim(),
      });
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setIsUserSelectorOpen(false);
      return;
    }

    void loadUsers(1, false);
  }, [isOpen, searchKeyword, loadUsers]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSearchKeyword(userSearch.trim());
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen, userSearch]);

  useEffect(() => {
    if (sendToAll) {
      setIsUserSelectorOpen(false);
    }
  }, [sendToAll]);

  useEffect(() => {
    if (!isUserSelectorOpen) {
      return;
    }

    const handlePointerDownOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const isInsideTrigger = selectorTriggerRef.current?.contains(target);
      const isInsideDropdown = selectorDropdownRef.current?.contains(target);

      if (!isInsideTrigger && !isInsideDropdown) {
        setIsUserSelectorOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isUserSelectorOpen]);

  const updateSelectorPlacement = useCallback(() => {
    if (!isUserSelectorOpen || !selectorTriggerRef.current) {
      return;
    }

    const triggerRect = selectorTriggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = selectorDropdownRef.current?.offsetHeight ?? 280;

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    const shouldOpenTop =
      spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    const nextPlacement: 'top' | 'bottom' = shouldOpenTop ? 'top' : 'bottom';

    setSelectorPlacement(nextPlacement);

    const availableSpace =
      nextPlacement === 'top' ? spaceAbove - 16 : spaceBelow - 16;

    setSelectorMaxHeight(Math.max(160, Math.min(320, availableSpace)));
  }, [isUserSelectorOpen]);

  useEffect(() => {
    if (!isUserSelectorOpen) {
      return;
    }

    const rafId = window.requestAnimationFrame(updateSelectorPlacement);

    const handleReposition = () => {
      updateSelectorPlacement();
    };

    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isUserSelectorOpen, updateSelectorPlacement]);

  useEffect(() => {
    if (!isOpen) {
      setSendToAll(false);
      setSelectedUserIds([]);
      setUserSearch('');
      setSearchKeyword('');
      setUsers([]);
      setUserPageIndex(1);
      setHasNextUsersPage(false);
      setSubmitError(null);
      setSubmitSuccess(null);
      setEditorContent({ html: '', text: '' });
      editor?.commands.clearContent();
    }
  }, [editor, isOpen]);

  const selectedUsersLabel = useMemo(() => {
    if (selectedUserIds.length === 0) {
      return 'Chọn người nhận cố định';
    }

    if (selectedUserIds.length === 1) {
      const selectedUser = users.find((user) => user.id === selectedUserIds[0]);
      return selectedUser?.name || selectedUser?.email || '1 người dùng đã chọn';
    }

    return `${selectedUserIds.length} người dùng đã chọn`;
  }, [selectedUserIds, users]);

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }

      return [...prev, userId];
    });
  };

  const handleLoadMoreUsers = () => {
    if (!hasNextUsersPage || isLoadingMoreUsers) {
      return;
    }

    void loadUsers(userPageIndex + 1, true);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!editorContent.text) {
      setSubmitError('Vui lòng nhập nội dung thông báo');
      return;
    }

    if (editorContent.html.length > MAX_MESSAGE_LENGTH) {
      setSubmitError('Nội dung HTML không được vượt quá 4000 ký tự');
      return;
    }

    if (!sendToAll && selectedUserIds.length === 0) {
      setSubmitError('Vui lòng chọn ít nhất 1 người dùng nhận thông báo');
      return;
    }

    try {
      setIsSubmitting(true);

      const sanitizedHtml = DOMPurify.sanitize(editorContent.html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'span'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
        ALLOW_DATA_ATTR: false,
      });

      const response = await sendSystemNotification({
        sendToAll,
        userIds: sendToAll ? [] : selectedUserIds,
        message: sanitizedHtml,
      });

      setSubmitSuccess(response.message || 'Gửi thông báo hệ thống thành công');

      setSelectedUserIds([]);
      setUserSearch('');
      setSearchKeyword('');
      setEditorContent({ html: '', text: '' });
      editor?.commands.clearContent();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể gửi thông báo hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-visible">
        <DialogHeader className="border-b border-slate-100 dark:border-slate-700 px-6 py-4">
          <DialogTitle className="text-xl font-bold">Tạo thông báo hệ thống</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nội dung thông báo</p>
            <div className="max-w-full break-all">
              <SystemNotificationEditor editor={editor} characterCount={editorContent.text.length} maxLength={MAX_MESSAGE_LENGTH} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gửi toàn bộ người dùng</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bật để gửi thông báo cho toàn bộ user đang hoạt động</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={sendToAll}
              onClick={() => setSendToAll((prev) => !prev)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                sendToAll ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.18)]' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${sendToAll ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Người nhận cố định</p>

            <div className="relative">
              <button
                ref={selectorTriggerRef}
                type="button"
                disabled={sendToAll}
                onClick={() => setIsUserSelectorOpen((prev) => !prev)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-400 dark:disabled:text-slate-500"
              >
                {sendToAll ? 'Đang bật gửi toàn bộ người dùng' : selectedUsersLabel}
              </button>

              {isUserSelectorOpen && !sendToAll && (
                <div
                  ref={selectorDropdownRef}
                  className={`absolute left-0 z-[80] w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg ${selectorPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                >
                  <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(event) => setUserSearch(event.target.value)}
                      placeholder="Tìm theo tên hoặc email"
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="overflow-y-auto p-2" style={{ maxHeight: `${selectorMaxHeight}px` }}>
                    {isLoadingUsers && (
                      <p className="px-2 py-2 text-sm text-slate-500 dark:text-slate-400">Đang tải danh sách người dùng...</p>
                    )}

                    {!isLoadingUsers && usersError && (
                      <p className="px-2 py-2 text-sm text-red-600 dark:text-red-400">{usersError}</p>
                    )}

                    {!isLoadingUsers && !usersError && users.length === 0 && (
                      <p className="px-2 py-2 text-sm text-slate-500 dark:text-slate-400">Không tìm thấy người dùng phù hợp</p>
                    )}

                    {!isLoadingUsers && !usersError && users.map((user) => {
                      const isSelected = selectedUserIds.includes(user.id);
                      const initials = (user.name || '?').trim().split(' ').slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');

                      return (
                        <label key={user.id} className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelectUser(user.id)} className="mt-3" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-slate-700 dark:text-slate-200">{user.name || 'Không có tên'}</span>
                            <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{user.email || 'Chưa có email'}</span>
                          </span>
                        </label>
                      );
                    })}

                    {!usersError && hasNextUsersPage && (
                      <div className="pt-2">
                        <button type="button" onClick={handleLoadMoreUsers} disabled={isLoadingMoreUsers} className="w-full rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                          {isLoadingMoreUsers ? 'Đang tải thêm...' : 'Xem thêm'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {submitError && (
            <p className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">{submitError}</p>
          )}

          {submitSuccess && (
            <p className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{submitSuccess}</p>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
          <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">Đóng</button>
          <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed">{isSubmitting ? 'Đang gửi...' : 'Gửi thông báo'}</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
