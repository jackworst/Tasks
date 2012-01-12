package models;

import javax.persistence.*;

import play.db.jpa.*;

@Entity
public class Item extends Model {
	public String title;

	@Column(columnDefinition = "TEXT")
	public String description;
	
	public boolean done;
}
