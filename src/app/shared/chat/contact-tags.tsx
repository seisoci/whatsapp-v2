'use client';

import { useState, useEffect, useRef } from 'react';
import { PiPlus, PiX, PiTag } from 'react-icons/pi';
import { Button, Input, ActionIcon, Popover, Badge, Text } from 'rizzui';
import { chatApi, type Tag, type Contact } from '@/lib/api/chat';
import DeletePopover from '@/components/delete-popover';

const TAG_COLORS = [
  { name: 'Blue', value: 'blue', class: 'bg-blue-100 text-blue-700', previewClass: 'bg-blue-500' },
  { name: 'Red', value: 'red', class: 'bg-red-100 text-red-700', previewClass: 'bg-red-500' },
  { name: 'Green', value: 'green', class: 'bg-green-100 text-green-700', previewClass: 'bg-green-500' },
  { name: 'Yellow', value: 'yellow', class: 'bg-yellow-100 text-yellow-700', previewClass: 'bg-yellow-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-100 text-purple-700', previewClass: 'bg-purple-500' },
  { name: 'Gray', value: 'gray', class: 'bg-gray-100 text-gray-700', previewClass: 'bg-gray-500' },
];

interface TagItemProps {
  tag: Tag;
  onRemove: (id: string) => void;
}

function TagItem({ tag, onRemove }: TagItemProps) {
  const colorClass = TAG_COLORS.find(c => c.value === tag.color)?.class || 'bg-blue-100 text-blue-700';

  return (
    <Badge
      variant="flat"
      className={`${colorClass} px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1`}
    >
      {tag.name}
      <Popover placement="bottom">
        <Popover.Trigger>
          <button
            type="button"
            className="hover:opacity-60 transition-opacity"
            aria-label="Remove tag"
          >
            <PiX className="h-3 w-3" />
          </button>
        </Popover.Trigger>
        <Popover.Content className="z-10">
          {({ setOpen }) => (
            <div className="w-56 pb-2 pt-1 text-left rtl:text-right">
              <Text
                as="h6"
                className="mb-0.5 flex items-start text-sm font-semibold text-gray-700 sm:items-center"
              >
                Delete Tag
              </Text>
              <Text className="mb-2 leading-relaxed text-gray-500">
                Are you sure you want to remove "{tag.name}" tag?
              </Text>
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  className="h-7"
                  onClick={() => {
                    onRemove(tag.id);
                    setOpen(false);
                  }}
                >
                  Yes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() => setOpen(false)}
                >
                  No
                </Button>
              </div>
            </div>
          )}
        </Popover.Content>
      </Popover>
    </Badge>
  );
}



interface ContactTagsProps {
  contact: Contact;
  onUpdate: (updatedContact: Contact) => void;
}

export default function ContactTags({ contact, onUpdate }: ContactTagsProps) {
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('blue');
  const [isCreating, setIsCreating] = useState(false);

  const handleAddTag = async (tagId: string) => {
    try {
      const updatedContact = await chatApi.addTagToContact(contact.id, tagId);
      if (updatedContact) {
        onUpdate(updatedContact); // Update contact in parent
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      setIsCreating(true);
      const response = await chatApi.createTag({
        name: newTagName.trim(),
        color: selectedColor,
      });
      
      console.log('Create Tag Response:', response);

      // Unwrap the response to get the tag object
      // createTag in api/chat.ts returns response.data which IS the tag object.
      // Wait, createTag in api/chat.ts also unwraps?
      // Let's verify createTag in api/chat.ts.
      // It returns response.data.
      // So 'response' here IS the Tag object.
      // But my code below does: const newTag = response.data || response;
      // That works for Tag object.
      
      const newTag = response; 
      
      if (newTag?.id) {
        console.log('New Tag ID:', newTag.id);
        // Auto assign
        await handleAddTag(newTag.id);
        
        setNewTagName('');
        setSelectedColor('blue');
      } else {
        console.error('Created tag has no ID:', newTag);
      }
    } catch (error: any) {
      console.error('Failed to create tag:', error);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveTag = async (e: React.MouseEvent | null, tagId: string) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const updatedContact = await chatApi.removeTagFromContact(contact.id, tagId);
      if (updatedContact) {
        onUpdate(updatedContact);
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Existing Tags */}
      {(contact.tags || []).map((tag) => (
        <TagItem 
          key={tag.id} 
          tag={tag} 
          onRemove={(id) => handleRemoveTag(null, id)} 
        />
      ))}

      {/* Add Tag Button */}
      <Popover placement="bottom-start">
        <Popover.Trigger>
          <button 
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <PiPlus className="h-4 w-4" />
          </button>
        </Popover.Trigger>
        <Popover.Content className="z-50 p-3 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg">
          <div className="space-y-3">
            {/* Create Input */}
            <div>
              <Input
                placeholder="Tag name..."
                size="sm"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="mb-3"
              />
              
              <div className="pt-1">
                <Text className="text-xs font-medium mb-2">Color</Text>
                
                {/* Color Selection */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {TAG_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-5 h-5 rounded-full ${color.previewClass} transition-transform hover:scale-110 ${selectedColor === color.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      title={color.name}
                    />
                  ))}
                </div>
                
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={handleCreateTag}
                  isLoading={isCreating}
                  disabled={!newTagName.trim()}
                >
                  Add Tag
                </Button>
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover>
    </div>
  );
}
