"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { Activity } from "@/lib/types";
import ActivityCard from "./ActivityCard";

export default function KanbanColumn({
  droppableId,
  title,
  count,
  icon,
  headerColor,
  bgClass,
  dragOverClass,
  activities,
  onAdd,
  onEdit,
  onView,
  onDelete,
  onRequestConclude,
  clockOffsetMs = 0,
}: {
  droppableId: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  headerColor: string;
  bgClass: string;
  dragOverClass: string;
  activities: Activity[];
  onAdd?: () => void;
  onEdit: (a: Activity) => void;
  onView: (a: Activity) => void;
  onDelete: (a: Activity) => void;
  onRequestConclude: (a: Activity) => void;
  clockOffsetMs?: number;
}) {
  return (
    <div className={`${bgClass} rounded-2xl flex flex-col min-h-[420px] max-h-[70vh] border`}>
      <div className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-2">
          <span className={headerColor}>{icon}</span>
          <h2 className={`font-semibold text-[15px] ${headerColor}`}>{title}</h2>
          <span className="bg-white/80 text-gray-600 text-xs font-semibold rounded-full px-2 py-0.5 shadow-sm">
            {count}
          </span>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="w-8 h-8 rounded-full bg-vivo-purple hover:bg-vivo-purpleDark text-white flex items-center justify-center text-lg leading-none shadow-sm transition-colors"
            title="Nova atividade"
          >
            +
          </button>
        )}
      </div>

      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto scrollbar-thin px-3 pb-3 rounded-b-2xl transition-colors ${
              snapshot.isDraggingOver ? dragOverClass : ""
            }`}
          >
            {activities.map((activity, index) => (
              <Draggable key={activity.id} draggableId={String(activity.id)} index={index}>
                {(dragProvided) => (
                  <ActivityCard
                    activity={activity}
                    innerRef={dragProvided.innerRef}
                    draggableProps={dragProvided.draggableProps}
                    dragHandleProps={dragProvided.dragHandleProps}
                    onEdit={() => onEdit(activity)}
                    onView={() => onView(activity)}
                    onDelete={() => onDelete(activity)}
                    onRequestConclude={() => onRequestConclude(activity)}
                    clockOffsetMs={clockOffsetMs}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {activities.length === 0 && (
              <div className="text-center text-xs text-gray-400 py-8">Nenhuma atividade</div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
