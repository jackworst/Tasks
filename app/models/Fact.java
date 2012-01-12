package models;

import javax.persistence.*;

import play.db.jpa.*;

@Entity
public class Fact extends Model {
	@Column(columnDefinition = "TEXT")
	public String fact;
}
