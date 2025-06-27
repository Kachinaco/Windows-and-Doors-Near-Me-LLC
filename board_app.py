"""
Monday.com-style Board Builder with FastAPI
Row-based project management system
"""

import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
import json

from fastapi import FastAPI, Request, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel
import uvicorn

# Database setup
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./boards.db')
if DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+psycopg2://', 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Enums
class ColumnType(str, Enum):
    STATUS = "status"
    TEXT = "text"
    DATE = "date"
    PEOPLE = "people"
    NUMBER = "number"
    TAGS = "tags"
    TIMELINE = "timeline"
    SUBITEMS = "subitems"

# Database Models
class Board(Base):
    __tablename__ = "boards"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_by = Column(String, default="User")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    columns = relationship("BoardColumn", back_populates="board", cascade="all, delete-orphan")
    items = relationship("BoardItem", back_populates="board", cascade="all, delete-orphan")

class BoardColumn(Base):
    __tablename__ = "columns"
    
    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id"))
    name = Column(String, nullable=False)
    type = Column(SQLEnum(ColumnType), nullable=False)
    order = Column(Integer, default=0)
    
    board = relationship("Board", back_populates="columns")
    values = relationship("ItemValue", back_populates="column", cascade="all, delete-orphan")

class BoardItem(Base):
    __tablename__ = "items"
    
    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("boards.id"))
    group_name = Column(String, default="Main Group")
    created_on = Column(DateTime, default=datetime.utcnow)
    order = Column(Integer, default=0)
    
    board = relationship("Board", back_populates="items")
    values = relationship("ItemValue", back_populates="item", cascade="all, delete-orphan")

class ItemValue(Base):
    __tablename__ = "item_values"
    
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"))
    column_id = Column(Integer, ForeignKey("columns.id"))
    value = Column(Text)  # JSON string for complex values
    
    item = relationship("BoardItem", back_populates="values")
    column = relationship("BoardColumn", back_populates="values")

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models
class ColumnCreate(BaseModel):
    board_id: int
    name: str
    type: ColumnType

class ItemCreate(BaseModel):
    board_id: int
    group_name: str = "Main Group"

class CellUpdate(BaseModel):
    item_id: int
    column_id: int
    value: str

# FastAPI app
app = FastAPI(title="Monday.com Style Board Builder")
templates = Jinja2Templates(directory="templates")

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Helper functions
def get_or_create_sample_board(db: Session):
    """Create a sample board if none exists"""
    board = db.query(Board).first()
    if not board:
        board = Board(name="Project Management Board", created_by="Admin")
        db.add(board)
        db.commit()
        db.refresh(board)
        
        # Create default columns
        default_columns = [
            ("Item", ColumnType.TEXT, 1),
            ("Status", ColumnType.STATUS, 2),
            ("People", ColumnType.PEOPLE, 3),
            ("Due Date", ColumnType.DATE, 4),
            ("Priority", ColumnType.NUMBER, 5),
            ("Tags", ColumnType.TAGS, 6),
        ]
        
        for name, col_type, order in default_columns:
            column = BoardColumn(
                board_id=board.id,
                name=name,
                type=col_type,
                order=order
            )
            db.add(column)
        
        db.commit()
        
        # Create sample items
        sample_items = [
            "Kitchen Window Replacement",
            "Living Room Patio Door",
            "Bathroom Window Upgrade",
            "Front Door Installation"
        ]
        
        for i, item_name in enumerate(sample_items):
            item = BoardItem(
                board_id=board.id,
                group_name="Active Projects",
                order=i
            )
            db.add(item)
            db.commit()
            db.refresh(item)
            
            # Add values for each column
            columns = db.query(BoardColumn).filter(BoardColumn.board_id == board.id).all()
            for column in columns:
                if column.name == "Item":
                    value = item_name
                elif column.name == "Status":
                    value = ["Working on it", "Done", "Stuck", "New"][i % 4]
                elif column.name == "People":
                    value = ["John Doe", "Jane Smith", "Bob Wilson", "Alice Brown"][i % 4]
                elif column.name == "Due Date":
                    value = f"2025-07-{15 + i:02d}"
                elif column.name == "Priority":
                    value = str([1, 2, 3, 2][i % 4])
                elif column.name == "Tags":
                    value = json.dumps([["Urgent", "Interior"][i % 2]])
                else:
                    value = ""
                
                item_value = ItemValue(
                    item_id=item.id,
                    column_id=column.id,
                    value=value
                )
                db.add(item_value)
        
        db.commit()
    
    return board

@app.get("/", response_class=HTMLResponse)
async def dashboard(request: Request, db: Session = Depends(get_db)):
    """Main board dashboard"""
    board = get_or_create_sample_board(db)
    
    # Get columns ordered by order field
    columns = db.query(BoardColumn).filter(
        BoardColumn.board_id == board.id
    ).order_by(BoardColumn.order).all()
    
    # Get items with their values
    items = db.query(BoardItem).filter(
        BoardItem.board_id == board.id
    ).order_by(BoardItem.group_name, BoardItem.order).all()
    
    # Build items with values
    items_data = []
    for item in items:
        item_dict = {
            "id": item.id,
            "group_name": item.group_name,
            "created_on": item.created_on,
            "values": {}
        }
        
        # Get all values for this item
        values = db.query(ItemValue).filter(ItemValue.item_id == item.id).all()
        for value in values:
            item_dict["values"][value.column_id] = value.value
        
        items_data.append(item_dict)
    
    return templates.TemplateResponse("board/dashboard.html", {
        "request": request,
        "board": board,
        "columns": columns,
        "items": items_data
    })

@app.post("/add_column")
async def add_column(
    board_id: int = Form(...),
    name: str = Form(...),
    type: ColumnType = Form(...),
    db: Session = Depends(get_db)
):
    """Add a new column to the board"""
    # Get max order
    max_order = db.query(BoardColumn).filter(
        BoardColumn.board_id == board_id
    ).count()
    
    column = BoardColumn(
        board_id=board_id,
        name=name,
        type=type,
        order=max_order + 1
    )
    db.add(column)
    db.commit()
    db.refresh(column)
    
    # Add empty values for existing items
    items = db.query(BoardItem).filter(BoardItem.board_id == board_id).all()
    for item in items:
        item_value = ItemValue(
            item_id=item.id,
            column_id=column.id,
            value=""
        )
        db.add(item_value)
    
    db.commit()
    
    return JSONResponse({
        "success": True,
        "column": {
            "id": column.id,
            "name": column.name,
            "type": column.type,
            "order": column.order
        }
    })

@app.post("/add_item")
async def add_item(
    board_id: int = Form(...),
    group_name: str = Form("Main Group"),
    db: Session = Depends(get_db)
):
    """Add a new item (row) to the board"""
    # Get max order for this group
    max_order = db.query(BoardItem).filter(
        BoardItem.board_id == board_id,
        BoardItem.group_name == group_name
    ).count()
    
    item = BoardItem(
        board_id=board_id,
        group_name=group_name,
        order=max_order + 1
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    
    # Create empty values for all columns
    columns = db.query(BoardColumn).filter(BoardColumn.board_id == board_id).all()
    for column in columns:
        default_value = "New Item" if column.name == "Item" else ""
        item_value = ItemValue(
            item_id=item.id,
            column_id=column.id,
            value=default_value
        )
        db.add(item_value)
    
    db.commit()
    
    return JSONResponse({
        "success": True,
        "item_id": item.id,
        "redirect": "/"
    })

@app.post("/update_cell")
async def update_cell(
    item_id: int = Form(...),
    column_id: int = Form(...),
    value: str = Form(...),
    db: Session = Depends(get_db)
):
    """Update a cell value"""
    # Find existing value or create new one
    item_value = db.query(ItemValue).filter(
        ItemValue.item_id == item_id,
        ItemValue.column_id == column_id
    ).first()
    
    if item_value:
        item_value.value = value
    else:
        item_value = ItemValue(
            item_id=item_id,
            column_id=column_id,
            value=value
        )
        db.add(item_value)
    
    db.commit()
    
    return JSONResponse({"success": True})

@app.get("/board/{board_id}", response_class=HTMLResponse)
async def view_board(request: Request, board_id: int, db: Session = Depends(get_db)):
    """View specific board"""
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    return await dashboard(request, db)

if __name__ == "__main__":
    uvicorn.run("board_app:app", host="0.0.0.0", port=5000, reload=True)