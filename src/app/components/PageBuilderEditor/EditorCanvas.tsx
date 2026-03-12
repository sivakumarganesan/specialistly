import React from 'react';
import { PageSection, Page } from '@/app/hooks/usePageBuilder';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Plus, Trash2, Copy, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
import { HeroSectionPreview } from './sections/HeroSection';
import { ServicesSectionPreview } from './sections/ServicesSection';
import { CoursesSectionPreview } from './sections/CoursesSection';

interface EditorCanvasProps {
  page: Page;
  onAddSection: () => void;
  onUpdateSection: (sectionId: string, updates: Partial<PageSection>) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderSections: (newSections: PageSection[]) => void;
  onSelectSection: (section: PageSection) => void;
  selectedSectionId?: string;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  page,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onReorderSections,
  onSelectSection,
  selectedSectionId,
}) => {
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const items = Array.from(page.sections);
    const [reorderedItem] = items.splice(source.index, 1);
    items.splice(destination.index, 0, reorderedItem);

    const reorderedSections = items.map((section, index) => ({
      ...section,
      order: index,
    }));

    onReorderSections(reorderedSections);
  };

  const renderSectionPreview = (section: PageSection) => {
    switch (section.type) {
      case 'hero':
        return <HeroSectionPreview section={section} />;
      case 'services':
        return <ServicesSectionPreview section={section} />;
      case 'courses':
        return <CoursesSectionPreview section={section} />;
      default:
        return (
          <div className="p-8 bg-gray-100 text-center">
            <p className="text-gray-600 font-medium">{section.type} Section</p>
            {section.title && <p className="text-sm text-gray-500">{section.title}</p>}
          </div>
        );
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* When no sections */}
        {page.sections.length === 0 && (
          <Card className="p-12 text-center border-2 border-dashed border-gray-300">
            <Plus className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No sections yet
            </h3>
            <p className="text-gray-500 mb-6">
              Add your first section to start building your page
            </p>
            <Button onClick={onAddSection} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          </Card>
        )}

        {/* Sections with drag-drop */}
        {page.sections.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-4 ${
                    snapshot.isDraggingOver ? 'bg-blue-50 p-4 rounded-lg' : ''
                  }`}
                >
                  {page.sections.map((section, index) => (
                    <Draggable
                      key={section._id}
                      draggableId={section._id || `section-${index}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative group ${
                            snapshot.isDragging
                              ? 'opacity-50 shadow-lg'
                              : ''
                          }`}
                        >
                          {/* Section card */}
                          <Card
                            className={`overflow-hidden transition-all ${
                              selectedSectionId === section._id
                                ? 'ring-2 ring-blue-500'
                                : ''
                            }`}
                            onClick={() => onSelectSection(section)}
                          >
                            {/* Section content */}
                            <div className="border-b border-gray-200">
                              {renderSectionPreview(section)}
                            </div>

                            {/* Section toolbar */}
                            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {/* Drag handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded text-sm">
                                  <span className="text-gray-600 font-mono">
                                    {section.type}
                                  </span>
                                  {section.title && (
                                    <>
                                      <span className="text-gray-300">•</span>
                                      <span className="text-gray-700 font-medium">
                                        {section.title}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={index === 0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const items = Array.from(page.sections);
                                    const [moved] = items.splice(index, 1);
                                    items.splice(index - 1, 0, moved);
                                    onReorderSections(items.map((s, i) => ({ ...s, order: i })));
                                  }}
                                  title="Move up"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={index === page.sections.length - 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const items = Array.from(page.sections);
                                    const [moved] = items.splice(index, 1);
                                    items.splice(index + 1, 0, moved);
                                    onReorderSections(items.map((s, i) => ({ ...s, order: i })));
                                  }}
                                  title="Move down"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Implement duplicate
                                  }}
                                  title="Duplicate section"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (section._id) {
                                      onDeleteSection(section._id);
                                    }
                                  }}
                                  title="Delete section"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {/* Add section button */}
                  <Button
                    onClick={onAddSection}
                    variant="outline"
                    className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 gap-2 text-gray-600 hover:text-blue-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </Button>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default EditorCanvas;
